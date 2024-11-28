# Generated by Django 4.2.11 on 2024-06-12 15:17

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("hub", "0130_rename_osm_data_genericdata_geocode_data_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="userproperties",
            name="user",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="properties",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]