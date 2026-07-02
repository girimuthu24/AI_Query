from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin


class JWTBlacklistMiddleware(MiddlewareMixin):
    """Block requests that carry a blacklisted access token."""

    def process_request(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header.split(' ')[1]
        # Lazy import to avoid app-registry issues at startup
        from superadmin_panel.models import BlacklistedToken
        if BlacklistedToken.objects.filter(token=token).exists():
            return JsonResponse({'detail': 'Token has been revoked.'}, status=401)
        return None
