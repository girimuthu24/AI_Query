"""
views.py

API view that handles file upload via multipart/form-data.
Uses Pandas to read the uploaded file into a DataFrame, stores the DataFrame
temporarily in memory (via memory_store.py), and returns a JSON response with:
  - session_id
  - column names
  - total row count
  - first 5 rows as a preview
"""

import logging
import pandas as pd
from io import BytesIO

from rest_framework.parsers import MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .serializers import FileUploadSerializer
from .memory_store import store_dataframe

logger = logging.getLogger(__name__)


class FileUploadAPIView(APIView):
    """
    POST /api/data-query/upload/

    Accepts a file (Excel or CSV) via multipart/form-data.
    Returns a JSON response with session_id, column names, row count, and preview.
    """
    parser_classes = [MultiPartParser]
    permission_classes = [AllowAny]

    def post(self, request):
        # ── 1. Validate the uploaded file using the serializer ──────────────
        serializer = FileUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = serializer.validated_data["file"]
        file_name = uploaded_file.name.lower()

        # ── 2. Read the file into a Pandas DataFrame ───────────────────────
        try:
            # Read the raw bytes from the in-memory uploaded file.
            raw_bytes = uploaded_file.read()

            if file_name.endswith(".csv"):
                df = pd.read_csv(BytesIO(raw_bytes))
            else:
                # .xlsx or .xls
                df = pd.read_excel(BytesIO(raw_bytes))

        except Exception as exc:
            logger.error("Failed to parse file '%s': %s", uploaded_file.name, exc)
            return Response(
                {"error": f"Could not read file: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 3. Check that the DataFrame is not empty ───────────────────────
        if df.empty:
            return Response(
                {"error": "The uploaded file contains no data."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 4. Store the DataFrame in memory and get a session_id ──────────
        session_id = store_dataframe(df)

        # ── 5. Build the preview (first 5 rows) ────────────────────────────
        preview = df.head(5).to_dict(orient="records")

        # ── 6. Return the response ─────────────────────────────────────────
        return Response(
            {
                "session_id": session_id,
                "columns": list(df.columns),
                "total_rows": len(df),
                "preview": preview,
            },
            status=status.HTTP_200_OK,
        )