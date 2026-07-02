import re
from django.contrib.auth.models import User
from rest_framework import serializers
from Backend.models.user_models import UserProfile
from Backend.models.admin_models import AdminActivityLog


class AdminCreateUserSerializer(serializers.Serializer):
    username         = serializers.CharField(min_length=3, max_length=150)
    email            = serializers.EmailField()
    phone            = serializers.CharField(min_length=7, max_length=15, required=False, allow_blank=True)
    first_name       = serializers.CharField(required=False, default='')
    last_name        = serializers.CharField(required=False, default='')
    password         = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value

    def validate_phone(self, value):
        if value and not re.match(r'^\+?\d{7,15}$', value):
            raise serializers.ValidationError('Enter a valid phone number.')
        if value and UserProfile.objects.filter(phone=value).exists():
            raise serializers.ValidationError('Phone number already registered.')
        return value

    def validate_password(self, value):
        errors = []
        if not re.search(r'[A-Z]', value): errors.append('uppercase letter')
        if not re.search(r'[a-z]', value): errors.append('lowercase letter')
        if not re.search(r'\d',    value): errors.append('digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value): errors.append('special character')
        if errors:
            raise serializers.ValidationError(f'Password must include: {", ".join(errors)}.')
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data


class UserDetailSerializer(serializers.ModelSerializer):
    phone      = serializers.SerializerMethodField()
    role       = serializers.SerializerMethodField()
    is_blocked = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'is_active', 'date_joined', 'phone', 'role', 'is_blocked']

    def get_phone(self, obj):
        try: return obj.profile.phone
        except Exception: return None

    def get_role(self, obj):
        try: return obj.user_role.role.name
        except Exception: return None

    def get_is_blocked(self, obj):
        try: return obj.profile.is_blocked
        except Exception: return False


class UserUpdateSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(required=False)

    class Meta:
        model  = User
        fields = ['email', 'first_name', 'last_name', 'phone']

    def validate_email(self, value):
        qs = User.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Email already registered.')
        return value

    def update(self, instance, validated_data):
        phone = validated_data.pop('phone', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if phone and hasattr(instance, 'profile'):
            instance.profile.phone = phone
            instance.profile.save()
        return instance


class ResetUserPasswordSerializer(serializers.Serializer):
    user_id      = serializers.IntegerField()
    new_password = serializers.CharField(min_length=8)


class AdminActivityLogSerializer(serializers.ModelSerializer):
    admin       = serializers.SerializerMethodField()
    target_user = serializers.SerializerMethodField()

    class Meta:
        model  = AdminActivityLog
        fields = ['id', 'admin', 'action', 'target_user', 'ip_address', 'extra', 'timestamp']

    def get_admin(self, obj):
        return obj.admin.username if obj.admin else None

    def get_target_user(self, obj):
        return obj.target_user.username if obj.target_user else None
