# Generated by Django 3.2.15 on 2024-03-13 20:00

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('help', '0003_delete_inappmessagefile_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='inappmessage',
            name='generic_related_objects',
            field=models.JSONField(default=dict),
        ),
        migrations.CreateModel(
            name='InAppMessageUsers',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('in_app_message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='help.inappmessage')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
