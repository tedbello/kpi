# Generated by Django 4.2.11 on 2024-07-30 13:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('audit_log', '0001_squashed_0006_remove_index_together'),
    ]

    operations = [
        migrations.AlterField(
            model_name='auditlog',
            name='action',
            field=models.CharField(choices=[('create', 'CREATE'), ('delete', 'DELETE'), ('in-trash', 'IN TRASH'), ('put-back', 'PUT BACK'), ('remove', 'REMOVE'), ('update', 'UPDATE'), ('auth', 'AUTH')], db_index=True, default='delete', max_length=10),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(models.F('metadata__asset_uid'), name='audit_log_asset_uid_idx'),
        ),
    ]
