from django.db import models
from django.contrib.auth.models import User


class AdminProfile(models.Model):
    """
    Tracks admin-specific metadata.
    Admin accounts are Django Users whose UserRole (superadmin_panel)
    role.name == 'admin'. This table adds admin-level status fields.
    """
    user         = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    is_active    = models.BooleanField(default=True)
    created_by   = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name='admins_created'
    )
    created_at   = models.DateTimeField(auto_now_add=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)

    def has_permission(self, codename):
        """Check if this admin has a specific permission granted by Super Admin."""
        return self.user.user_permissions_custom.filter(
            permission__codename=codename,
            is_active=True
        ).exists()

    def __str__(self):
        return f"Admin: {self.user.username} | active={self.is_active}"


class AdminActivityLog(models.Model):
    """Dedicated activity log for Admin-level actions."""
    admin       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='admin_logs')
    action      = models.CharField(max_length=255)
    target_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='targeted_logs'
    )
    ip_address  = models.GenericIPAddressField(null=True, blank=True)
    extra       = models.JSONField(default=dict, blank=True)
    timestamp   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.timestamp}] {self.admin} | {self.action}"
