from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('Backend', '0002_userprofile_delete_item'),
    ]

    operations = [
        # Step 1 — add registered_at with a one-off default for any existing rows
        migrations.AddField(
            model_name='userprofile',
            name='registered_at',
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,   # default only used during migration, not kept on model
        ),

        # Step 2 — remove blank=True from phone and add unique constraint
        migrations.AlterField(
            model_name='userprofile',
            name='phone',
            field=models.CharField(max_length=15, unique=True),
        ),
    ]
