from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Deprecated: Staff records have been removed. This command does nothing.'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING(
            'seed_staff is deprecated. Staff records no longer exist. '
            'Run "seed_superadmin" instead.'
        ))
