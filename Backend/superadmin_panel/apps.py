from django.apps import AppConfig


class SuperadminPanelConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'superadmin_panel'

    def ready(self):
        """Auto-create the default Super Admin on first run if none exists."""
        try:
            from django.db import connection
            tables = connection.introspection.table_names()
            # Only run after migrations have created the required tables
            if 'superadmin_panel_userrole' not in tables:
                return
            from superadmin_panel.models import Role, UserRole
            sa_role = Role.objects.filter(name='superadmin').first()
            if sa_role and not UserRole.objects.filter(role=sa_role).exists():
                from django.core.management import call_command
                call_command('seed_superadmin', verbosity=0)
        except Exception:
            pass
