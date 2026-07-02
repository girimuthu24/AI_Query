from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from superadmin_panel.models import Role, UserRole, Permission
from Backend.models.user_models import UserProfile

ROLES = ['superadmin', 'admin', 'user']
DEFAULT_PERMISSIONS = [
    'create_user', 'delete_user', 'update_data',
    'manage_system', 'manage_permissions', 'view_logs',
    'view_users', 'update_user',
]

SA_EMAIL    = 'superadmin@dataqueryai.com'
SA_PASSWORD = 'Admin@123'
SA_USERNAME = 'superadmin'


class Command(BaseCommand):
    help = 'Seed roles, permissions, and create the default Super Admin account if none exists.'

    def handle(self, *args, **options):
        # Ensure all three roles exist
        for role_name in ROLES:
            _, created = Role.objects.get_or_create(name=role_name)
            if created:
                self.stdout.write(f'  [OK] Role created: {role_name}')

        # Ensure default permissions exist
        for codename in DEFAULT_PERMISSIONS:
            Permission.objects.get_or_create(codename=codename)

        # Check if a super admin already exists
        sa_role = Role.objects.get(name='superadmin')
        if UserRole.objects.filter(role=sa_role).exists():
            self.stdout.write(self.style.WARNING('Super Admin already exists. Skipping.'))
            return

        user = User.objects.create(
            username=SA_USERNAME,
            email=SA_EMAIL,
            password=make_password(SA_PASSWORD),
            first_name='Super',
            last_name='Admin',
            is_staff=True,
            is_superuser=True,
        )
        UserRole.objects.create(user=user, role=sa_role, assigned_by=user)

        # Create a profile with must_change_password=True so the SA is forced to change on first login
        UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': 'admin', 'is_blocked': False, 'must_change_password': True}
        )

        self.stdout.write(self.style.SUCCESS(
            f'\n[DONE] Default Super Admin created\n'
            f'       Email:    {SA_EMAIL}\n'
            f'       Password: {SA_PASSWORD}\n'
            f'       NOTE: Must change password on first login!\n'
        ))
