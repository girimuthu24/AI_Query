from django.db import models
from django.contrib.auth.models import User


class UserActivityLog(models.Model):
    ACTION_CHOICES = [
        ('REGISTER',        'Register'),
        ('LOGIN',           'Login'),
        ('FAILED_LOGIN',    'Failed Login'),
        ('LOGOUT',          'Logout'),
        ('UPDATE_PROFILE',  'Update Profile'),
        ('CHANGE_PASSWORD', 'Change Password'),
    ]

    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action     = models.CharField(max_length=30, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    extra      = models.JSONField(default=dict, blank=True)
    timestamp  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.user.username} | {self.action}"


class UserProfile(models.Model):
    ROLE_CHOICES = [('admin', 'Admin'), ('user', 'User')]

    user                = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role                = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    phone               = models.CharField(max_length=15, unique=True, null=True, blank=True)
    is_blocked          = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=False)
    registered_at       = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} | {self.role}"
