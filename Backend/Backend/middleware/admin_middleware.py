from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin


class AdminActiveMiddleware(MiddlewareMixin):
    """
    For any request to /admin/* routes, verify the admin account is not blocked.
    Relies on JWTBlacklistMiddleware (superadmin_panel) already running first.
    """

    def process_request(self, request):
        if not request.path.startswith('/admin/'):
            return None
        # Skip Django's built-in /admin/ panel
        if request.path.startswith('/admin/login') or request.path == '/admin/':
            return None

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None

        from rest_framework_simplejwt.authentication import JWTAuthentication
        try:
            jwt_auth = JWTAuthentication()
            validated = jwt_auth.get_validated_token(
                jwt_auth.get_raw_token(jwt_auth.get_header(request))
            )
            user = jwt_auth.get_user(validated)
            if hasattr(user, 'admin_profile') and not user.admin_profile.is_active:
                return JsonResponse({'detail': 'Admin account is inactive or blocked.'}, status=403)
        except Exception:
            pass
        return None
