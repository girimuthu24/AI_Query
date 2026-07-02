from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from Backend.models.user_models import UserActivityLog
from Backend.permissions.user_permissions import IsUser
from Backend.serializers.user_serializers import (
    UserProfileSerializer, UpdateProfileSerializer,
    ChangePasswordSerializer, UserActivityLogSerializer,
)
from Backend.utils.helpers import log_user_action
from superadmin_panel.models import BlacklistedToken


class UserLogoutView(APIView):
    permission_classes = [IsUser]

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
        log_user_action(request.user, 'LOGOUT', request)
        return Response({'detail': 'Logged out successfully.'})


class UserProfileView(APIView):
    permission_classes = [IsUser]

    def get(self, request):
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return Response({'detail': 'Profile not found.'}, status=404)
        return Response(UserProfileSerializer(profile).data)


class UserUpdateProfileView(APIView):
    permission_classes = [IsUser]

    def put(self, request):
        serializer = UpdateProfileSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save(request.user)
        log_user_action(request.user, 'UPDATE_PROFILE', request)
        profile = request.user.profile
        return Response({'message': 'Profile updated.', 'profile': UserProfileSerializer(profile).data})


class UserChangePasswordView(APIView):
    permission_classes = [IsUser]

    def put(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save(request.user)

        # Clear must_change_password flag after successful change
        try:
            profile = request.user.profile
            if profile.must_change_password:
                profile.must_change_password = False
                profile.save()
        except Exception:
            pass

        log_user_action(request.user, 'CHANGE_PASSWORD', request)
        return Response({'message': 'Password changed successfully.'})


class UserActivityLogsView(APIView):
    permission_classes = [IsUser]

    def get(self, request):
        logs = UserActivityLog.objects.filter(
            user=request.user
        ).values('id', 'action', 'ip_address', 'extra', 'timestamp')[:100]
        return Response(list(logs))
