"""
serializers.py

DRF serializers for file upload validation.
- Validates that a file is provided.
- Checks that the file extension is one of .csv, .xlsx, or .xls.
- Checks that the file is not empty.
"""

import os
from rest_framework import serializers


# Allowed file extensions for upload.
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


class FileUploadSerializer(serializers.Serializer):
    """
    Serializer that validates an uploaded file via multipart/form-data.

    Expected field (form-data key): 'file'
    """
    file = serializers.FileField(allow_empty_file=False)

    def validate_file(self, value):
        """
        Validate the uploaded file:
          - Extension must be .csv, .xlsx, or .xls.
          - File must not be empty (enforced by allow_empty_file=False above,
            but we also do an explicit check).
        """
        # Extract file extension and convert to lowercase.
        ext = os.path.splitext(value.name)[1].lower()

        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f"Unsupported file type '{ext}'. "
                f"Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Explicitly check for empty file content.
        if value.size == 0:
            raise serializers.ValidationError("Uploaded file is empty.")

        return value