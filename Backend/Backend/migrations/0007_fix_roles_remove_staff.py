from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Backend', '0006_useractivitylog'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='must_change_password',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='role',
            field=models.CharField(
                choices=[('admin', 'Admin'), ('user', 'User')],
                default='user',
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name='userprofile',
            name='phone',
            field=models.CharField(max_length=15, unique=True, null=True, blank=True),
        ),
        migrations.DeleteModel(
            name='StaffRecord',
        ),
    ]
