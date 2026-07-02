import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


# ─── CustomUser ───────────────────────────────────────────────────────────────

class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra):
        if not email:
            raise ValueError('Email is required')
        user = self.model(email=self.normalize_email(email), username=username, **extra)
        user.set_password(password)  # always hashed via Django's PBKDF2/argon2
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        extra.setdefault('role', 'SUPER_ADMIN')
        return self.create_user(email, username, password, **extra)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('SUPER_ADMIN', 'Super Admin'),
        ('ADMIN',       'Admin'),
        ('USER',        'User'),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username   = models.CharField(max_length=150, unique=True)
    email      = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name  = models.CharField(max_length=150, blank=True)
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='USER')
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        'auth.Group',
        blank=True,
        related_name='ai_engine_users',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        blank=True,
        related_name='ai_engine_users',
        verbose_name='user permissions',
    )

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    objects = CustomUserManager()

    class Meta:
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]

    def __str__(self):
        return f'{self.email} [{self.role}]'


# ─── UploadSession ────────────────────────────────────────────────────────────
# Metadata only — no FileField/BinaryField. File is parsed in-memory by Pandas.

class UploadSession(models.Model):
    FILE_TYPE_CHOICES = [
        ('CSV',  'CSV'),
        ('XLSX', 'XLSX'),
        ('PDF',  'PDF'),
        ('PBI',  'Power BI'),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user           = models.ForeignKey(
        'CustomUser', on_delete=models.CASCADE, related_name='upload_sessions'
    )
    session_id     = models.CharField(max_length=64, db_index=True)  # key to in-memory store
    filename       = models.CharField(max_length=255)
    file_type      = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES)
    rows_count     = models.PositiveIntegerField()
    columns_count  = models.PositiveIntegerField()
    uploaded_at    = models.DateTimeField(auto_now_add=True)
    expires_at     = models.DateTimeField()  # set from SystemSettings.session_timeout_minutes

    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['session_id']),
            models.Index(fields=['uploaded_at']),
        ]

    def __str__(self):
        return f'{self.filename} ({self.file_type}) — {self.user.email}'


# ─── QueryHistory ─────────────────────────────────────────────────────────────

class QueryHistory(models.Model):
    QUERY_TYPE_CHOICES = [
        ('SEARCH',  'Search'),
        ('IDENTIFY', 'Identify'),
    ]

    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user             = models.ForeignKey(
        'CustomUser', on_delete=models.CASCADE, related_name='query_histories'
    )
    session_id       = models.CharField(max_length=64)  # links to UploadSession.session_id
    prompt           = models.TextField()
    query_type       = models.CharField(max_length=20, choices=QUERY_TYPE_CHOICES)
    execution_time_ms = models.PositiveIntegerField()
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['session_id']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'[{self.query_type}] {self.user.email} @ {self.created_at}'


# ─── ActivityLog ──────────────────────────────────────────────────────────────
# Immutable compliance log — never UPDATE or DELETE rows.

class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ('LOGIN',               'Login'),
        ('LOGOUT',              'Logout'),
        ('REGISTER',            'Register'),
        ('UPLOAD_FILE',         'Upload File'),
        ('DELETE_SESSION',      'Delete Session'),
        ('QUERY_SEARCH',        'Query Search'),
        ('PERSON_IDENTIFICATION', 'Person Identification'),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(
        'CustomUser', on_delete=models.CASCADE, related_name='activity_logs'
    )
    action     = models.CharField(max_length=30, choices=ACTION_CHOICES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['user']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'[{self.action}] {self.user.email} @ {self.created_at}'


# ─── SystemSettings (singleton) ───────────────────────────────────────────────
# Write access enforced in permissions.py — SUPER_ADMIN only.

class SystemSettings(models.Model):
    id                      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    openai_model            = models.CharField(max_length=50, default='gpt-4o')
    max_upload_size_mb      = models.PositiveIntegerField(default=25)
    session_timeout_minutes = models.PositiveIntegerField(default=60)
    enable_query_history    = models.BooleanField(default=True)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'System Settings'
        verbose_name_plural = 'System Settings'

    @classmethod
    def get(cls):
        """Always returns the singleton row, creating it on first call."""
        obj = cls.objects.first()
        if obj is None:
            obj, _ = cls.objects.get_or_create(id=uuid.uuid4())
        return obj

    def __str__(self):
        return f'SystemSettings (timeout={self.session_timeout_minutes}m)'


# ─── DashboardStats (singleton) ───────────────────────────────────────────────
# Recomputed via signal/management command — not written by API consumers.

class DashboardStats(models.Model):
    id                   = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    total_users          = models.PositiveIntegerField(default=0)
    total_admins         = models.PositiveIntegerField(default=0)
    total_uploads        = models.PositiveIntegerField(default=0)
    total_queries        = models.PositiveIntegerField(default=0)
    total_identifications = models.PositiveIntegerField(default=0)
    updated_at           = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = 'Dashboard Stats'
        verbose_name_plural = 'Dashboard Stats'

    @classmethod
    def refresh(cls):
        """Recompute and upsert the singleton stats row."""
        from django.db.models import Q
        stats, _ = cls.objects.get_or_create(
            pk=cls.objects.values_list('pk', flat=True).first() or uuid.uuid4()
        )
        stats.total_users  = CustomUser.objects.filter(role='USER').count()
        stats.total_admins = CustomUser.objects.filter(role__in=['ADMIN', 'SUPER_ADMIN']).count()
        stats.total_uploads = UploadSession.objects.count()
        stats.total_queries = QueryHistory.objects.filter(query_type='SEARCH').count()
        stats.total_identifications = QueryHistory.objects.filter(query_type='IDENTIFY').count()
        stats.save()
        return stats

    def __str__(self):
        return f'DashboardStats (updated={self.updated_at})'
