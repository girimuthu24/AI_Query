from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from .models import BlacklistedToken, Role, UserRole, Permission, UserPermission, ActivityLog
from .permissions import IsSuperAdmin
from .serializers import (
    LoginSerializer, UserCreateSerializer, UserUpdateSerializer,
    UserDetailSerializer, AssignRoleSerializer, GrantPermissionSerializer,
    ResetPasswordSerializer,
)
from .utils import log_action


# ─── Authentication ───────────────────────────────────────────────────────────

@method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True), name='post')
class SuperAdminLoginView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )
        if user is None:
            log_action(None, 'FAILED_LOGIN', request, {'username': serializer.validated_data['username']})
            return Response({'detail': 'Invalid credentials.'}, status=401)

        try:
            if user.user_role.role.name != 'superadmin':
                return Response({'detail': 'Access denied.'}, status=403)
        except Exception:
            return Response({'detail': 'Access denied. Role not assigned.'}, status=403)

        refresh = RefreshToken.for_user(user)
        log_action(user, 'SUPERADMIN_LOGIN', request)

        profile = getattr(user, 'profile', None)
        must_change = getattr(profile, 'must_change_password', False) if profile else False

        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id':                   user.id,
                'full_name':            f'{user.first_name} {user.last_name}'.strip() or user.username,
                'email':                user.email,
                'role':                 'super_admin',
                'must_change_password': must_change,
            },
        })


class SuperAdminLogoutView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        access_token  = request.META.get('HTTP_AUTHORIZATION', '').replace('Bearer ', '')
        if not refresh_token:
            return Response({'detail': 'Refresh token required.'}, status=400)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except (TokenError, Exception):
            pass
        BlacklistedToken.objects.get_or_create(token=access_token, defaults={'user': request.user})
        log_action(request.user, 'SUPERADMIN_LOGOUT', request)
        return Response({'detail': 'Logged out successfully.'})


class SuperAdminRefreshTokenView(APIView):
    permission_classes = []

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token required.'}, status=400)
        try:
            token = RefreshToken(refresh_token)
            return Response({'access': str(token.access_token)})
        except TokenError as e:
            return Response({'detail': str(e)}, status=401)


# ─── Admin CRUD ───────────────────────────────────────────────────────────────

class CreateAdminView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        data = request.data.copy()
        data['role'] = 'admin'
        serializer = UserCreateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            admin = serializer.save()
            log_action(request.user, f'CREATE_ADMIN:{admin.username}', request)
            return Response(UserDetailSerializer(admin).data, status=201)
        return Response(serializer.errors, status=400)


class ViewAdminsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        admin_ids = UserRole.objects.filter(role__name='admin').values_list('user_id', flat=True)
        admins = User.objects.filter(id__in=admin_ids)
        return Response(UserDetailSerializer(admins, many=True).data)


class UpdateAdminView(APIView):
    permission_classes = [IsSuperAdmin]

    def put(self, request, user_id):
        try:
            admin = User.objects.get(id=user_id, user_role__role__name='admin')
        except User.DoesNotExist:
            return Response({'detail': 'Admin not found.'}, status=404)
        serializer = UserUpdateSerializer(admin, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_action(request.user, f'UPDATE_ADMIN:{admin.username}', request)
            return Response(UserDetailSerializer(admin).data)
        return Response(serializer.errors, status=400)


class DeleteAdminView(APIView):
    permission_classes = [IsSuperAdmin]

    def delete(self, request, user_id):
        try:
            admin = User.objects.get(id=user_id, user_role__role__name='admin')
        except User.DoesNotExist:
            return Response({'detail': 'Admin not found.'}, status=404)
        username = admin.username
        admin.delete()
        log_action(request.user, f'DELETE_ADMIN:{username}', request)
        return Response({'detail': f'Admin {username} deleted.'})


class BlockAdminView(APIView):
    permission_classes = [IsSuperAdmin]

    def put(self, request, user_id):
        try:
            admin = User.objects.get(id=user_id, user_role__role__name='admin')
        except User.DoesNotExist:
            return Response({'detail': 'Admin not found.'}, status=404)
        admin.is_active = not admin.is_active
        admin.save()
        state = 'UNBLOCKED' if admin.is_active else 'BLOCKED'
        log_action(request.user, f'{state}_ADMIN:{admin.username}', request)
        return Response({'detail': f'Admin {admin.username} is now {"active" if admin.is_active else "blocked"}.'})


class ResetAdminPasswordView(APIView):
    permission_classes = [IsSuperAdmin]

    def put(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        try:
            admin = User.objects.get(id=serializer.validated_data['user_id'], user_role__role__name='admin')
        except User.DoesNotExist:
            return Response({'detail': 'Admin not found.'}, status=404)
        admin.password = make_password(serializer.validated_data['new_password'])
        admin.save()
        log_action(request.user, f'RESET_ADMIN_PASSWORD:{admin.username}', request)
        return Response({'detail': 'Password reset successfully.'})


# ─── User CRUD ────────────────────────────────────────────────────────────────

class CreateUserView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        data = request.data.copy()
        data['role'] = 'user'
        serializer = UserCreateSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            log_action(request.user, f'CREATE_USER:{user.username}', request)
            return Response(UserDetailSerializer(user).data, status=201)
        return Response(serializer.errors, status=400)


class ViewUsersView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        user_ids = UserRole.objects.filter(role__name='user').values_list('user_id', flat=True)
        users = User.objects.filter(id__in=user_ids)
        return Response(UserDetailSerializer(users, many=True).data)


class UpdateUserView(APIView):
    permission_classes = [IsSuperAdmin]

    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, user_role__role__name='user')
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_action(request.user, f'UPDATE_USER:{user.username}', request)
            return Response(UserDetailSerializer(user).data)
        return Response(serializer.errors, status=400)


class DeleteUserView(APIView):
    permission_classes = [IsSuperAdmin]

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, user_role__role__name='user')
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        username = user.username
        user.delete()
        log_action(request.user, f'DELETE_USER:{username}', request)
        return Response({'detail': f'User {username} deleted.'})


class BlockUserView(APIView):
    permission_classes = [IsSuperAdmin]

    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, user_role__role__name='user')
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        user.is_active = not user.is_active
        user.save()
        state = 'UNBLOCKED' if user.is_active else 'BLOCKED'
        log_action(request.user, f'{state}_USER:{user.username}', request)
        return Response({'detail': f'User {user.username} is now {"active" if user.is_active else "blocked"}.'})


class ResetUserPasswordView(APIView):
    permission_classes = [IsSuperAdmin]

    def put(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        try:
            user = User.objects.get(id=serializer.validated_data['user_id'], user_role__role__name='user')
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        user.password = make_password(serializer.validated_data['new_password'])
        user.save()
        log_action(request.user, f'RESET_USER_PASSWORD:{user.username}', request)
        return Response({'detail': 'Password reset successfully.'})


# ─── Role Management ──────────────────────────────────────────────────────────

class AssignRoleView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        serializer = AssignRoleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        try:
            user = User.objects.get(id=serializer.validated_data['user_id'])
            role = Role.objects.get(name=serializer.validated_data['role_name'])
        except (User.DoesNotExist, Role.DoesNotExist) as e:
            return Response({'detail': str(e)}, status=404)
        UserRole.objects.update_or_create(
            user=user,
            defaults={'role': role, 'assigned_by': request.user}
        )
        log_action(request.user, f'ASSIGN_ROLE:{user.username}->{role.name}', request)
        return Response({'detail': f'Role {role.name} assigned to {user.username}.'})


class ChangeRoleView(APIView):
    permission_classes = [IsSuperAdmin]

    def put(self, request):
        serializer = AssignRoleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        try:
            user_role = UserRole.objects.select_related('user', 'role').get(
                user_id=serializer.validated_data['user_id']
            )
            new_role = Role.objects.get(name=serializer.validated_data['role_name'])
        except (UserRole.DoesNotExist, Role.DoesNotExist) as e:
            return Response({'detail': str(e)}, status=404)
        old_name = user_role.role.name
        user_role.role = new_role
        user_role.assigned_by = request.user
        user_role.save()
        log_action(request.user, f'CHANGE_ROLE:{user_role.user.username} {old_name}->{new_role.name}', request)
        return Response({'detail': f'Role changed from {old_name} to {new_role.name}.'})


class RemoveRoleView(APIView):
    permission_classes = [IsSuperAdmin]

    def delete(self, request, user_id):
        try:
            user_role = UserRole.objects.get(user_id=user_id)
        except UserRole.DoesNotExist:
            return Response({'detail': 'Role not found for this user.'}, status=404)
        username = user_role.user.username
        user_role.delete()
        log_action(request.user, f'REMOVE_ROLE:{username}', request)
        return Response({'detail': f'Role removed from {username}.'})


# ─── Permission Management ────────────────────────────────────────────────────

class GrantPermissionView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        serializer = GrantPermissionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        try:
            user = User.objects.get(id=serializer.validated_data['user_id'])
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        perm, _ = Permission.objects.get_or_create(codename=serializer.validated_data['codename'])
        up, created = UserPermission.objects.get_or_create(
            user=user, permission=perm,
            defaults={'granted_by': request.user, 'is_active': True}
        )
        if not created:
            up.is_active = True
            up.save()
        log_action(request.user, f'GRANT_PERMISSION:{user.username}:{perm.codename}', request)
        return Response({'detail': f'Permission {perm.codename} granted to {user.username}.'})


class RemovePermissionView(APIView):
    permission_classes = [IsSuperAdmin]

    def delete(self, request):
        serializer = GrantPermissionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        try:
            up = UserPermission.objects.get(
                user_id=serializer.validated_data['user_id'],
                permission__codename=serializer.validated_data['codename']
            )
        except UserPermission.DoesNotExist:
            return Response({'detail': 'Permission not found.'}, status=404)
        up.is_active = False
        up.save()
        log_action(request.user, f'REVOKE_PERMISSION:{up.user.username}:{up.permission.codename}', request)
        return Response({'detail': 'Permission revoked.'})


# ─── System Logs ──────────────────────────────────────────────────────────────

class SystemLogsView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        logs = ActivityLog.objects.select_related('user').values(
            'id', 'user__username', 'role', 'action', 'ip_address', 'extra', 'timestamp'
        )[:500]
        return Response(list(logs))


# ─── Force Password Change (first-run Super Admin) ────────────────────────────

class ForceChangePasswordView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        from django.contrib.auth.hashers import make_password
        new_password = request.data.get('new_password', '')
        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'}, status=400)
        request.user.password = make_password(new_password)
        request.user.save()
        # Clear the flag
        try:
            profile = request.user.profile
            profile.must_change_password = False
            profile.save()
        except Exception:
            pass
        log_action(request.user, 'FORCE_PASSWORD_CHANGED', request)
        return Response({'detail': 'Password updated successfully.'})
