import pandas as pd
import google.generativeai as genai
from django.conf import settings


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


def query_ai(sheet_summary: str, user_query: str) -> str:
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        raise ValueError('Gemini API key is not configured.')
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    prompt = (
        'You are a data analysis assistant. '
        'Below is a summary of a spreadsheet the user uploaded:\n\n'
        f'{sheet_summary}\n\n'
        f'User question: {user_query}'
    )
    return model.generate_content(prompt).text
