from Backend.models.admin_models import AdminActivityLog
from Backend.models.user_models import UserActivityLog


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_admin_action(admin_user, action, request=None, target_user=None, extra=None):
    AdminActivityLog.objects.create(
        admin=admin_user,
        action=action,
        target_user=target_user,
        ip_address=get_client_ip(request) if request else None,
        extra=extra or {},
    )


def log_user_action(user, action, request=None, extra=None):
    if not user or not user.pk:
        return
    UserActivityLog.objects.create(
        user=user,
        action=action,
        ip_address=get_client_ip(request) if request else None,
        extra=extra or {},
    )
