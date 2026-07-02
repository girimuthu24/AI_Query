import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        return Response(
            {'error': True, 'detail': response.data},
            status=response.status_code,
        )
    
    # Log the traceback for unhandled exceptions (Internal Server Error)
    logger.exception("Unhandled exception occurred: %s", exc)
    
    return Response({'error': True, 'detail': 'Internal server error.'}, status=500)

