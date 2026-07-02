import logging
import os
import tempfile

from rest_framework.parsers import MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response

from .services import dispatch_parser

logger = logging.getLogger(__name__)


class FileParseView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({'error': 'No file provided.'}, status=400)

        suffix = os.path.splitext(uploaded.name)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            for chunk in uploaded.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        logger.info('Received file: %s → temp: %s', uploaded.name, tmp_path)
        return Response(dispatch_parser(tmp_path))