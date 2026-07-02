import re
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from Backend.models.user_models import UserProfile, UserActivityLog


class UserProfileSerializer(serializers.ModelSerializer):
    username   = serializers.CharField(source='user.username',   read_only=True)
    email      = serializers.EmailField(source='user.email',     read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name  = serializers.CharField(source='user.last_name',  read_only=True)
    user_id    = serializers.IntegerField(source='user.id',      read_only=True)

    class Meta:
        model  = UserProfile
        fields = ['user_id', 'username', 'email', 'first_name', 'last_name',
                  'phone', 'role', 'is_blocked', 'registered_at']
        read_only_fields = ['role', 'is_blocked', 'registered_at']


class UpdateProfileSerializer(serializers.Serializer):
    email      = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False, max_length=150)
    last_name  = serializers.CharField(required=False, max_length=150)
    phone      = serializers.CharField(required=False, min_length=7, max_length=15)

    def validate_email(self, value):
        user = self.context['request'].user
        if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('This email is already registered.')
        return value

    def validate_phone(self, value):
        if not re.match(r'^\+?\d{7,15}$', value):
            raise serializers.ValidationError('Enter a valid phone number.')
        user = self.context['request'].user
        if UserProfile.objects.filter(phone=value).exclude(user=user).exists():
            raise serializers.ValidationError('This phone number is already registered.')
        return value

    def save(self, user):
        data = self.validated_data
        if 'email'      in data: user.email      = data['email']
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name'  in data: user.last_name  = data['last_name']
        user.save()
        if 'phone' in data and hasattr(user, 'profile'):
            user.profile.phone = data['phone']
            user.profile.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password     = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate_new_password(self, value):
        errors = []
        if not re.search(r'[A-Z]', value): errors.append('one uppercase letter')
        if not re.search(r'[a-z]', value): errors.append('one lowercase letter')
        if not re.search(r'\d',    value): errors.append('one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value): errors.append('one special character')
        if errors:
            raise serializers.ValidationError(f'Password must contain at least {", ".join(errors)}.')
        return value

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        if data['current_password'] == data['new_password']:
            raise serializers.ValidationError({'new_password': 'New password must differ from current.'})
        return data

    def save(self, user):
        user.password = make_password(self.validated_data['new_password'])
        user.save()
        return user


class UserActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserActivityLog
        fields = ['id', 'action', 'ip_address', 'extra', 'timestamp']
