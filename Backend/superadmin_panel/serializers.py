from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from .models import UserRole, Role, UserPermission, Permission


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserCreateSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=['admin', 'user'], write_only=True)

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        role_name = validated_data.pop('role')
        validated_data['password'] = make_password(validated_data['password'])
        user = User.objects.create(**validated_data)
        role = Role.objects.get(name=role_name)
        requester = self.context['request'].user
        UserRole.objects.create(user=user, role=role, assigned_by=requester)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['email', 'first_name', 'last_name', 'is_active']


class UserDetailSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined', 'role']

    def get_role(self, obj):
        try:
            return obj.user_role.role.name
        except Exception:
            return None


class AssignRoleSerializer(serializers.Serializer):
    user_id   = serializers.IntegerField()
    role_name = serializers.ChoiceField(choices=['superadmin', 'admin', 'user'])


class GrantPermissionSerializer(serializers.Serializer):
    user_id  = serializers.IntegerField()
    codename = serializers.CharField()


class ResetPasswordSerializer(serializers.Serializer):
    user_id      = serializers.IntegerField()
    new_password = serializers.CharField(min_length=8)
