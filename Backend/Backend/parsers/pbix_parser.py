import json
import logging
import zipfile

logger = logging.getLogger(__name__)


def parse(file_path: str) -> dict:
    try:
        with zipfile.ZipFile(file_path, "r") as z:
            names = z.namelist()

            if "DataModelSchema" in names:
                return _parse_schema(z)

            if "Report/Layout" in names:
                return _parse_layout(z)

            return {
                "file_type": "PBIX",
                "issue": "No DataModelSchema or Layout found",
                "contents": names,
            }
    except Exception as exc:
        logger.error("PBIX parse error: %s", exc)
        return {"error": str(exc)}


def _parse_schema(z: zipfile.ZipFile) -> dict:
    with z.open("DataModelSchema") as f:
        schema = json.loads(f.read().decode("utf-16-le"))

    tables = []
    for table in schema.get("model", {}).get("tables", []):
        tables.append({
            "name": table["name"],
            "columns": [c["name"] for c in table.get("columns", [])],
            "measures": [m["name"] for m in table.get("measures", [])],
        })

    return {"file_type": "PBIX", "source": "DataModelSchema", "tables": tables}


def _parse_layout(z: zipfile.ZipFile) -> dict:
    with z.open("Report/Layout") as f:
        layout = json.loads(f.read().decode("utf-16-le"))

    sections = [s.get("displayName", "unnamed") for s in layout.get("sections", [])]
    return {"file_type": "PBIX", "source": "Layout", "report_pages": sections}
