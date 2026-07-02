from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to users with role == 'admin' and active AdminProfile."""
    message = 'Access restricted to Admin only.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            return (
                request.user.user_role.role.name == 'admin'
                and request.user.admin_profile.is_active
            )
        except Exception:
            return False


class IsAdminOrSuperAdmin(BasePermission):
    """Allow access to Admin or Super Admin."""
    message = 'Admin or Super Admin access required.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            role = request.user.user_role.role.name
            if role == 'superadmin':
                return True
            if role == 'admin':
                return request.user.admin_profile.is_active
        except Exception:
            pass
        return False


class AdminHasPermission(BasePermission):
    """
    Checks that the admin has a specific codename permission.
    Set `required_permission` on the view class.

    Example:
        class CreateUserView(APIView):
            permission_classes = [IsAdmin, AdminHasPermission]
            required_permission = 'create_user'
    """
    message = 'You do not have permission to perform this action.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Super Admin bypasses all permission checks
        try:
            if request.user.user_role.role.name == 'superadmin':
                return True
        except Exception:
            pass
        codename = getattr(view, 'required_permission', None)
        if not codename:
            return True
        try:
            return request.user.admin_profile.has_permission(codename)
        except Exception:
            return False
