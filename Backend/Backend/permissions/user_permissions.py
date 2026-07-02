from rest_framework.permissions import BasePermission


class IsUser(BasePermission):
    """
    Allow access only to authenticated users with role == 'user'
    who are not blocked.
    """
    message = 'Access restricted to active Users only.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            profile = request.user.profile
            return profile.role == 'user' and not profile.is_blocked
        except Exception:
            return False


class IsOwner(BasePermission):
    """
    Object-level guard: user may only touch their own data.
    The view must pass the target user_id as a URL kwarg named 'user_id',
    or the view handles it by always scoping to request.user.
    """
    message = 'You can only access your own data.'

    def has_object_permission(self, request, view, obj):
        return obj == request.user or getattr(obj, 'user', None) == request.user
