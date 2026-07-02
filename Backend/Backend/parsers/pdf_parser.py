import logging
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


def parse(file_path: str) -> dict:
    try:
        doc = fitz.open(file_path)
        pages = []
        scanned_pages = 0

        for i in range(min(3, doc.page_count)):
            page = doc[i]
            text = page.get_text().strip()
            if not text:
                scanned_pages += 1

            tables = []
            for t in page.find_tables():
                tables.append(t.extract())

            pages.append({
                "page": i + 1,
                "text_preview": text[:500] if text else None,
                "tables_found": len(tables),
                "table_sample": tables[0] if tables else None,
            })

        issues = []
        if scanned_pages:
            issues.append(
                f"{scanned_pages} page(s) have no text layer — scanned PDF, OCR needed (try pytesseract)"
            )

        return {
            "file_type": "PDF",
            "page_count": doc.page_count,
            "pages_preview": pages,
            "issues": issues,
        }
    except Exception as exc:
        logger.error("PDF parse error: %s", exc)
        return {"error": str(exc)}
