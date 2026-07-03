import logging
import pandas as pd
from google import genai
from django.conf import settings

logger = logging.getLogger(__name__)


def parse_sheet(file) -> str:
    name = file.name.lower()
    if name.endswith('.csv'):
        df = pd.read_csv(file)
    elif name.endswith(('.xlsx', '.xls')):
        df = pd.read_excel(file)
    else:
        raise ValueError('Unsupported file type. Upload a CSV or Excel file.')

    return '\n\n'.join([
        f'Columns: {list(df.columns)}',
        f'Shape: {df.shape[0]} rows x {df.shape[1]} columns',
        f'Data types:\n{df.dtypes.to_string()}',
        f'Sample (first 5 rows):\n{df.head(5).to_string(index=False)}',
        f'Descriptive stats:\n{df.describe(include="all").to_string()}',
    ])


def _get_client():
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        raise ValueError('Gemini API key is not configured.')
    return genai.Client(api_key=api_key)


def _call_gemini(client, prompt):
    """Call Gemini with fallback models."""
    models = ['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash']
    last_error = None
    for model_name in models:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            return response.text
        except Exception as e:
            last_error = e
            error_str = str(e)
            if '429' in error_str or 'RESOURCE_EXHAUSTED' in error_str:
                logger.warning('Quota exceeded for %s, trying next model...', model_name)
                continue
            logger.error('Gemini API error with %s: %s', model_name, e)
            raise
    logger.error('All Gemini models exhausted: %s', last_error)
    raise last_error


def _generate_pandas_code(client, df, user_query):
    """Ask AI to generate a Pandas expression to answer the user's query."""
    col_info = '\n'.join([f'  - "{col}" (dtype: {df[col].dtype}, sample values: {list(df[col].dropna().unique()[:5])})' for col in df.columns])

    prompt = (
        'You are a Python/Pandas code generator. Given the DataFrame info below, '
        'write a SINGLE Python expression using Pandas to answer the user\'s question.\n\n'
        'RULES:\n'
        '- The DataFrame variable is called `df`\n'
        '- Return ONLY the Python expression, no explanation, no markdown, no ```\n'
        '- Use case-insensitive matching with .str.lower().str.contains() or .str.lower() == for text searches\n'
        '- For counting: use len(df[...]) or df[...].value_counts()\n'
        '- For filtering: return df[...].to_string(index=False)\n'
        '- The expression must be a single line that produces a result\n\n'
        f'DataFrame columns:\n{col_info}\n\n'
        f'Total rows: {len(df)}\n\n'
        f'User question: {user_query}\n\n'
        'Python expression:'
    )
    return _call_gemini(client, prompt)


def _safe_exec_pandas(df, code_str):
    """Safely execute a Pandas expression on the DataFrame."""
    # Clean up the code
    code_str = code_str.strip()
    # Remove markdown code blocks if present
    code_str = code_str.replace('```python', '').replace('```', '').strip()
    # Remove any print() wrapper
    if code_str.startswith('print(') and code_str.endswith(')'):
        code_str = code_str[6:-1]

    logger.info('Executing Pandas code: %s', code_str)

    # Only allow safe operations
    allowed_names = {
        'df': df,
        'pd': pd,
        'len': len,
        'str': str,
        'int': int,
        'float': float,
        'list': list,
        'sum': sum,
        'min': min,
        'max': max,
        'round': round,
        'sorted': sorted,
        'abs': abs,
        'True': True,
        'False': False,
        'None': None,
    }

    try:
        result = eval(code_str, {"__builtins__": {}}, allowed_names)
        return result
    except Exception as e:
        logger.warning('Pandas execution failed: %s (code: %s)', e, code_str)
        return None


def query_ai(sheet_summary: str, user_query: str, df: pd.DataFrame = None) -> str:
    client = _get_client()

    pandas_result = None
    pandas_code = None

    # Step 1: Try to compute exact answer using Pandas
    if df is not None:
        try:
            pandas_code = _generate_pandas_code(client, df, user_query)
            pandas_result = _safe_exec_pandas(df, pandas_code)
            logger.info('Pandas result: %s', str(pandas_result)[:200])
        except Exception as e:
            logger.warning('Pandas code generation failed: %s', e)

    # Step 2: Ask AI to give a natural language answer using the computed result
    if pandas_result is not None:
        result_str = str(pandas_result)
        # Truncate very long results
        if len(result_str) > 3000:
            result_str = result_str[:3000] + '\n... (truncated)'

        prompt = (
            'You are a data analysis assistant. The user asked a question about their spreadsheet data.\n'
            'A Pandas computation was run on the ACTUAL data and produced the EXACT result below.\n\n'
            f'User question: {user_query}\n\n'
            f'Pandas code executed: {pandas_code}\n'
            f'EXACT computed result:\n{result_str}\n\n'
            'Please give a clear, friendly answer using ONLY this exact computed result. '
            'Do NOT change the numbers or counts — they are 100% accurate from the actual data. '
            'Format the answer nicely.'
        )
    else:
        # Fallback: send summary if Pandas approach failed
        prompt = (
            'You are a precise data analysis assistant. '
            'Below is the complete data from a spreadsheet the user uploaded.\n\n'
            'IMPORTANT: Be specific and give exact values from the data. '
            'Do not make up or estimate information.\n\n'
            f'--- SPREADSHEET DATA ---\n{sheet_summary}\n--- END DATA ---\n\n'
            f'User question: {user_query}'
        )

    return _call_gemini(client, prompt)
