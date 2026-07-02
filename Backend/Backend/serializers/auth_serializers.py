import re
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from Backend.models.user_models import UserProfile


class RegisterSerializer(serializers.Serializer):
    full_name        = serializers.CharField(min_length=2, max_length=150)
    email            = serializers.EmailField()
    password         = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('This email is already registered.')
        return value.lower()

    def validate_password(self, value):
        errors = []
        if not re.search(r'[A-Z]', value): errors.append('one uppercase letter')
        if not re.search(r'[a-z]', value): errors.append('one lowercase letter')
        if not re.search(r'\d',    value): errors.append('one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value): errors.append('one special character')
        if errors:
            raise serializers.ValidationError(f'Password must contain at least {", ".join(errors)}.')
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        full_name  = validated_data.pop('full_name')
        email      = validated_data['email']
        password   = validated_data['password']

        # Use email prefix as username, ensure uniqueness
        base_username = email.split('@')[0]
        username = base_username
        suffix = 1
        while User.objects.filter(username__iexact=username).exists():
            username = f'{base_username}{suffix}'
            suffix += 1

        parts = full_name.strip().split(' ', 1)
        first_name = parts[0]
        last_name  = parts[1] if len(parts) > 1 else ''

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        # Role is always 'user' — never trust client input
        UserProfile.objects.create(user=user, role='user', is_blocked=False)
        return user


class CheckFieldSerializer(serializers.Serializer):
    field = serializers.ChoiceField(choices=['email'])
    value = serializers.CharField()


class UnifiedLoginSerializer(serializers.Serializer):
    """Single login endpoint for all three roles. Role is read from the DB."""
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email    = data['email'].strip().lower()
        password = data['password']

        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({'email': 'No account found with this email.'})

        user = authenticate(username=user_obj.username, password=password)
        if not user:
            raise serializers.ValidationError({'password': 'Incorrect password.'})

        if not user.is_active:
            raise serializers.ValidationError({'account': 'Your account is inactive.'})

        # Determine role from DB — never from client
        role = _get_role(user)
        if role is None:
            raise serializers.ValidationError({'account': 'No role assigned. Contact support.'})

        # For user role, check blocked status
        if role == 'user':
            profile = getattr(user, 'profile', None)
            if profile and profile.is_blocked:
                raise serializers.ValidationError({'account': 'Your account has been blocked. Contact support.'})

        data['user'] = user
        data['role'] = role
        return data


def _get_role(user):
    """Read the canonical role from the DB. Returns: 'super_admin', 'admin', or 'user'."""
    # superadmin_panel UserRole takes priority
    try:
        panel_role = user.user_role.role.name
        if panel_role == 'superadmin':
            return 'super_admin'
        if panel_role == 'admin':
            return 'admin'
        if panel_role == 'user':
            return 'user'
    except Exception:
        pass

    # Fall back to UserProfile role
    try:
        profile_role = user.profile.role
        if profile_role == 'admin':
            return 'admin'
        if profile_role == 'user':
            return 'user'
    except Exception:
        pass

    return None
