from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from superadmin_panel.models import Role, UserRole
from Backend.models.user_models import UserProfile


def get_users_queryset():
    """Return all Users with role == 'user'."""
    user_ids = UserRole.objects.filter(role__name='user').values_list('user_id', flat=True)
    return User.objects.filter(id__in=user_ids).select_related('profile', 'user_role')


def create_user_account(validated_data, created_by):
    """Create a Django User + UserProfile + UserRole(user) atomically."""
    phone = validated_data.pop('phone')
    password = validated_data.pop('password')
    validated_data.pop('confirm_password', None)

    user = User.objects.create(
        username=validated_data['username'],
        email=validated_data.get('email', ''),
        first_name=validated_data.get('first_name', ''),
        last_name=validated_data.get('last_name', ''),
        password=make_password(password),
    )
    UserProfile.objects.create(user=user, phone=phone, role='user')
    role = Role.objects.get(name='user')
    UserRole.objects.create(user=user, role=role, assigned_by=created_by)
    return user


def set_user_blocked(user, blocked: bool):
    profile = user.profile
    profile.is_blocked = blocked
    user.is_active = not blocked
    profile.save()
    user.save()


def reset_user_password(user, new_password: str):
    user.password = make_password(new_password)
    user.save()
