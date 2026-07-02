import logging
import mimetypes
import os
from pathlib import Path

from .parsers.registry import PARSER_REGISTRY

logger = logging.getLogger(__name__)


def dispatch_parser(file_path: str) -> dict:
    ext = Path(file_path).suffix.lower()
    parser = PARSER_REGISTRY.get(ext)

    if parser is None:
        mime, _ = mimetypes.guess_type(file_path)
        logger.warning("Unknown extension %s, detected MIME: %s", ext, mime)
        return {
            "error": f"Unsupported file type '{ext}'",
            "detected_mime": mime,
            "hint": "Install python-magic for more accurate detection.",
        }

    logger.info("Parsing %s with %s", file_path, parser.__module__)
    result = parser(file_path)

    try:
        os.remove(file_path)
        logger.info("Temp file removed: %s", file_path)
    except OSError as exc:
        logger.warning("Could not remove temp file %s: %s", file_path, exc)

    return result
