# Generated by Django 3.2.15 on 2022-12-29 15:55

from django.conf import settings
import django.contrib.auth.models
from django.db import migrations, models
import django.db.models.deletion
import kobo.apps.project_views.fields
import kpi.fields.kpi_uid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='AssignmentProjectViewM2M',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ],
        ),
        migrations.CreateModel(
            name='Assignment',
            fields=[
            ],
            options={
                'proxy': True,
                'indexes': [],
                'constraints': [],
            },
            bases=(settings.AUTH_USER_MODEL,),
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name='ProjectView',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('uid', kpi.fields.kpi_uid.KpiUidField(uid_prefix='pv')),
                ('name', models.CharField(max_length=200)),
                ('countries', models.CharField(max_length=1000)),
                ('permissions', kobo.apps.project_views.fields.ChoiceArrayField(base_field=models.CharField(choices=[('change_metadata_asset', 'change_metadata_asset'), ('view_asset', 'view_asset'), ('view_submissions', 'view_submissions')], max_length=25), default=list, size=None)),
                ('users', models.ManyToManyField(related_name='project_views', through='project_views.AssignmentProjectViewM2M', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'project view',
                'ordering': ('name',),
            },
        ),
        migrations.AddField(
            model_name='assignmentprojectviewm2m',
            name='project_view',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='project_views.projectview'),
        ),
        migrations.AddField(
            model_name='assignmentprojectviewm2m',
            name='user',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
    ]
