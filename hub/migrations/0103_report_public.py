# Generated by Django 4.2.11 on 2024-05-04 17:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0102_merge_0065_alter_areatype_area_type_0101_apitoken"),
    ]

    operations = [
        migrations.AddField(
            model_name="report",
            name="public",
            field=models.BooleanField(blank=True, default=False),
        ),
    ]