# Generated by Django 4.2.11 on 2024-12-09 19:51

from django.db import migrations
import django_choices_field.fields
import hub.models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0142_alter_hubhomepage_organisation"),
    ]

    operations = [
        migrations.AlterField(
            model_name="externaldatasource",
            name="data_type",
            field=django_choices_field.fields.TextChoicesField(
                choices=[
                    ("MEMBER", "Members or supporters"),
                    ("GROUP", "Group or organisation"),
                    ("AREA_STATS", "Area statistics"),
                    ("EVENT", "Events"),
                    ("LOCATION", "Locations"),
                    ("STORY", "Stories"),
                    ("OTHER", "Other"),
                ],
                choices_enum=hub.models.ExternalDataSource.DataSourceType,
                default="OTHER",
                max_length=10,
            ),
        ),
    ]
