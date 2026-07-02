from django.db import models
from django.contrib.auth.models import User


# ─── Roles ────────────────────────────────────────────────────────────────────

class Role(models.Model):
    ROLE_CHOICES = [('superadmin', 'SuperAdmin'), ('admin', 'Admin'), ('user', 'User')]
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True)

    def __str__(self):
        return self.name


class UserRole(models.Model):
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_role')
    role        = models.ForeignKey(Role, on_delete=models.PROTECT)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='roles_assigned')
    assigned_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} -> {self.role.name}"


class RolePermission(models.Model):
    role     = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    codename = models.CharField(max_length=100)

    class Meta:
        unique_together = ('role', 'codename')

    def __str__(self):
        return f"{self.role.name} | {self.codename}"


# ─── Permissions ──────────────────────────────────────────────────────────────

class Permission(models.Model):
    codename    = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.codename


class UserPermission(models.Model):
    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_permissions_custom')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='permissions_granted')
    granted_at = models.DateTimeField(auto_now_add=True)
    is_active  = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'permission')

    def __str__(self):
        return f"{self.user.username} | {self.permission.codename}"


# ─── Activity Logs ────────────────────────────────────────────────────────────

class ActivityLog(models.Model):
    user       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    role       = models.CharField(max_length=20, blank=True)
    action     = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    extra      = models.JSONField(default=dict, blank=True)
    timestamp  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.role} | {self.action}"


# ─── Token Blacklist ──────────────────────────────────────────────────────────

class BlacklistedToken(models.Model):
    token          = models.TextField(unique=True)
    user           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blacklisted_tokens')
    blacklisted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} | {self.blacklisted_at}"
