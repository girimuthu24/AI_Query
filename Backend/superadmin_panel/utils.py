from .models import ActivityLog


def get_client_ip(request):
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_action(user, action, request=None, extra=None):
    role = ''
    try:
        role = user.user_role.role.name if user else ''
    except Exception:
        pass
    ActivityLog.objects.create(
        user=user,
        role=role,
        action=action,
        ip_address=get_client_ip(request) if request else None,
        extra=extra or {},
    )
