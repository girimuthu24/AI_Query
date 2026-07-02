# Backend/admin.py
from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import UserProfile, StaffRecord


# ── Inline: show UserProfile fields inside the User admin form ─────────────────
class UserProfileInline(admin.StackedInline):
    model  = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fields = ('role', 'phone', 'registered_at')
    readonly_fields = ('registered_at',)


# ── Extend Django's built-in User admin ───────────────────────────────────────
class UserAdmin(BaseUserAdmin):
    inlines    = (UserProfileInline,)
    list_display  = ('username', 'email', 'get_role', 'get_phone', 'is_active', 'date_joined')
    list_filter   = ('is_active', 'profile__role')
    search_fields = ('username', 'email', 'profile__phone')

    @admin.display(description='Role')
    def get_role(self, obj):
        return getattr(getattr(obj, 'profile', None), 'role', '—')

    @admin.display(description='Phone')
    def get_phone(self, obj):
        return getattr(getattr(obj, 'profile', None), 'phone', '—')


# ── Staff Record Admin ────────────────────────────────────────────────────────
@admin.register(StaffRecord)
class StaffRecordAdmin(admin.ModelAdmin):
    list_display  = ('staff_id', 'name', 'gender', 'age', 'domain', 'created_at')
    list_filter   = ('gender', 'domain')
    search_fields = ('staff_id', 'name', 'domain')
    readonly_fields = ('created_at',)


# Re-register User with extended admin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)
