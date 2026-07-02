from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    message = 'Access restricted to Super Admin only.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            return request.user.user_role.role.name == 'superadmin'
        except Exception:
            return False
