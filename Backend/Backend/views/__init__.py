"""
API root view — provides a simple list of available API endpoints
when accessing the /api/ URL directly.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def api_root(request):
    """
    Root API endpoint that lists all available namespaces.
    """
    base_url = request.build_absolute_uri("/api/")
    return Response(
        {
            "message": "DataQuery AI API",
            "version": "1.0.0",
            "endpoints": {
                "auth": {
                    "register": f"{base_url}register/",
                    "login": f"{base_url}login/",
                    "check_field": f"{base_url}check-field/",
                },
                "user": {
                    "profile": f"{base_url}user/profile/",
                    "update_profile": f"{base_url}user/update-profile/",
                    "change_password": f"{base_url}user/change-password/",
                    "activity_logs": f"{base_url}user/activity-logs/",
                    "logout": f"{base_url}user/logout/",
                },
                "admin": {
                    "view_users": f"{base_url}admin/view-users/",
                    "block_user": f"{base_url}admin/block-user/<id>/",
                    "reset_password": f"{base_url}admin/reset-user-password/",
                    "activity_logs": f"{base_url}admin/activity-logs/",
                    "logout": f"{base_url}admin/logout/",
                },
                "ai_engine": {
                    "upload_file": f"{base_url}ai/upload/file/",
                    "upload_preview": f"{base_url}ai/upload/preview/",
                    "upload_query": f"{base_url}ai/upload/query/",
                    "upload_clear": f"{base_url}ai/upload/clear/",
                },
                "data_query": {
                    "file_upload": f"{base_url}data-query/upload/",
                },
                "super_admin": f"{request.build_absolute_uri('/superadmin/')}",
            },
        }
    )