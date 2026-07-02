from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from Backend.serializers.auth_serializers import RegisterSerializer, UnifiedLoginSerializer, CheckFieldSerializer
from Backend.models.user_models import UserProfile


def _tokens(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


def _user_payload(user, role):
    profile = getattr(user, 'profile', None)
    must_change = getattr(profile, 'must_change_password', False) if profile else False
    # For super_admin, check flag stored differently
    if role == 'super_admin':
        must_change = getattr(profile, 'must_change_password', False) if profile else False

    return {
        'id':                  user.id,
        'full_name':           f'{user.first_name} {user.last_name}'.strip() or user.username,
        'email':               user.email,
        'role':                role,
        'must_change_password': must_change,
    }


class CheckFieldView(APIView):
    permission_classes = []

    def get(self, request):
        s = CheckFieldSerializer(data=request.query_params)
        if not s.is_valid():
            return Response(s.errors, status=400)
        value = s.validated_data['value'].strip()
        taken = User.objects.filter(email__iexact=value).exists()
        return Response({'taken': taken})


class RegisterView(APIView):
    permission_classes = []

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        if s.is_valid():
            user = s.save()
            return Response({'message': 'Account created successfully.'}, status=201)
        return Response(s.errors, status=400)


class LoginView(APIView):
    """Unified login for all 3 roles. Returns role so frontend can redirect."""
    permission_classes = []

    def post(self, request):
        s = UnifiedLoginSerializer(data=request.data)
        if s.is_valid():
            user   = s.validated_data['user']
            role   = s.validated_data['role']
            tokens = _tokens(user)
            return Response({
                'message': 'Login successful.',
                'tokens':  tokens,
                'user':    _user_payload(user, role),
            })
        return Response(s.errors, status=400)


def HomePage(request):
    return render(request, 'Home.html')
