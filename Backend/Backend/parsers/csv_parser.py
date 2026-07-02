import logging
import pandas as pd

logger = logging.getLogger(__name__)


def parse(file_path: str) -> dict:
    try:
        sep = "\t" if file_path.endswith(".tsv") else ","
        preview = pd.read_csv(file_path, sep=sep, nrows=5)
        full = pd.read_csv(file_path, sep=sep)

        return {
            "file_type": "TSV" if sep == "\t" else "CSV",
            "shape": {"rows": full.shape[0], "columns": full.shape[1]},
            "schema": {col: str(dtype) for col, dtype in full.dtypes.items()},
            "sample": preview.to_dict(orient="records"),
            "issues": {
                col: int(full[col].isna().sum())
                for col in full.columns
                if full[col].isna().any()
            },
        }
    except Exception as exc:
        logger.error("CSV parse error: %s", exc)
        return {"error": str(exc)}
