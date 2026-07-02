from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from Backend.models.admin_models import AdminProfile, AdminActivityLog
from Backend.permissions.admin_permissions import IsAdmin, AdminHasPermission
from Backend.serializers.admin_serializers import (
    AdminCreateUserSerializer,
    UserDetailSerializer, UserUpdateSerializer,
    ResetUserPasswordSerializer, AdminActivityLogSerializer,
)
from Backend.services.admin_service import (
    get_users_queryset, create_user_account,
    set_user_blocked, reset_user_password,
)
from Backend.utils.helpers import log_admin_action, get_client_ip
from superadmin_panel.models import BlacklistedToken



class AdminLogoutView(APIView):
    permission_classes = [IsAdmin]

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
        BlacklistedToken.objects.get_or_create(
            token=access_token, defaults={'user': request.user}
        )
        log_admin_action(request.user, 'ADMIN_LOGOUT', request)
        return Response({'detail': 'Logged out successfully.'})


class AdminRefreshTokenView(APIView):
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


# ─── User Management ──────────────────────────────────────────────────────────

class AdminCreateUserView(APIView):
    permission_classes = [IsAdmin, AdminHasPermission]
    required_permission = 'create_user'

    def post(self, request):
        serializer = AdminCreateUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        user = create_user_account(serializer.validated_data.copy(), created_by=request.user)
        log_admin_action(request.user, f'CREATE_USER:{user.username}', request, target_user=user)
        return Response(UserDetailSerializer(user).data, status=201)


class AdminViewUsersView(APIView):
    permission_classes = [IsAdmin, AdminHasPermission]
    required_permission = 'view_users'

    def get(self, request):
        users = get_users_queryset()
        return Response(UserDetailSerializer(users, many=True).data)


class AdminUpdateUserView(APIView):
    permission_classes = [IsAdmin, AdminHasPermission]
    required_permission = 'update_user'

    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, user_role__role__name='user')
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            log_admin_action(request.user, f'UPDATE_USER:{user.username}', request, target_user=user)
            return Response(UserDetailSerializer(user).data)
        return Response(serializer.errors, status=400)


class AdminDeleteUserView(APIView):
    permission_classes = [IsAdmin, AdminHasPermission]
    required_permission = 'delete_user'

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, user_role__role__name='user')
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        username = user.username
        log_admin_action(request.user, f'DELETE_USER:{username}', request, target_user=user)
        user.delete()
        return Response({'detail': f'User {username} deleted.'})


class AdminBlockUserView(APIView):
    permission_classes = [IsAdmin, AdminHasPermission]
    required_permission = 'update_user'

    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, user_role__role__name='user')
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        # Toggle block state
        currently_blocked = getattr(user.profile, 'is_blocked', False)
        set_user_blocked(user, not currently_blocked)
        state = 'BLOCKED' if not currently_blocked else 'UNBLOCKED'
        log_admin_action(request.user, f'{state}_USER:{user.username}', request, target_user=user)
        return Response({
            'detail': f'User {user.username} is now {"blocked" if not currently_blocked else "active"}.'
        })


class AdminResetUserPasswordView(APIView):
    permission_classes = [IsAdmin, AdminHasPermission]
    required_permission = 'update_user'

    def put(self, request):
        serializer = ResetUserPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        try:
            user = User.objects.get(
                id=serializer.validated_data['user_id'],
                user_role__role__name='user'
            )
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)
        reset_user_password(user, serializer.validated_data['new_password'])
        log_admin_action(request.user, f'RESET_USER_PASSWORD:{user.username}', request, target_user=user)
        return Response({'detail': 'Password reset successfully.'})


# ─── Admin's Own Permission View ──────────────────────────────────────────────

class AdminViewMyPermissionsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        perms = request.user.user_permissions_custom.filter(
            is_active=True
        ).values_list('permission__codename', flat=True)
        return Response({'permissions': list(perms)})


# ─── Activity Logs ────────────────────────────────────────────────────────────

class AdminActivityLogsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        logs = AdminActivityLog.objects.filter(
            admin=request.user
        ).select_related('admin', 'target_user')[:200]
        return Response(AdminActivityLogSerializer(logs, many=True).data)
