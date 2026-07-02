from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta

from .models import CustomUser, UploadSession, QueryHistory, ActivityLog, SystemSettings, DashboardStats


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model  = CustomUser
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name']

    def validate(self, data):
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        # role defaults to USER per spec; password hashed by create_user
        return CustomUser.objects.create_user(
            email      = validated_data['email'],
            username   = validated_data['username'],
            password   = validated_data['password'],
            first_name = validated_data.get('first_name', ''),
            last_name  = validated_data.get('last_name', ''),
        )


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        data['user'] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'created_at']
        read_only_fields = ['id', 'email', 'role', 'created_at']


# ─── Upload Session ───────────────────────────────────────────────────────────

class UploadSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UploadSession
        fields = [
            'id', 'session_id', 'filename', 'file_type',
            'rows_count', 'columns_count', 'uploaded_at', 'expires_at',
        ]
        read_only_fields = ['id', 'uploaded_at', 'expires_at']


class UploadFileInputSerializer(serializers.Serializer):
    """Validates file metadata sent by the client after in-memory parsing."""
    file      = serializers.FileField(write_only=True)  # held in memory only, never saved
    file_type = serializers.CharField()

    _EXT_MAP = {
        '.csv': 'CSV', 'csv': 'CSV',
        '.xlsx': 'XLSX', 'xlsx': 'XLSX',
        '.xls': 'XLSX', 'xls': 'XLSX',
        '.pdf': 'PDF', 'pdf': 'PDF',
        '.pbix': 'PBI', 'pbix': 'PBI',
    }

    def validate_file_type(self, value):
        normalized = self._EXT_MAP.get(value.lower())
        if not normalized:
            raise serializers.ValidationError(f"Unsupported file type '{value}'.")
        return normalized


# ─── Query History ────────────────────────────────────────────────────────────

class QueryHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = QueryHistory
        fields = ['id', 'session_id', 'prompt', 'query_type', 'execution_time_ms', 'created_at']
        read_only_fields = ['id', 'created_at']


# ─── Activity Log ─────────────────────────────────────────────────────────────

class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ActivityLog
        fields = ['id', 'action', 'description', 'ip_address', 'created_at']
        read_only_fields = fields


# ─── System Settings ──────────────────────────────────────────────────────────

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SystemSettings
        fields = [
            'id', 'openai_model', 'max_upload_size_mb',
            'session_timeout_minutes', 'enable_query_history', 'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']


# ─── Dashboard Stats ──────────────────────────────────────────────────────────

class DashboardStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DashboardStats
        fields = [
            'id', 'total_users', 'total_admins', 'total_uploads',
            'total_queries', 'total_identifications', 'updated_at',
        ]
        read_only_fields = fields
