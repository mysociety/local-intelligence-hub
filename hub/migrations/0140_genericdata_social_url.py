# Generated by Django 4.2.11 on 2024-09-16 18:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0139_externaldatasource_can_display_point_field_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="genericdata",
            name="social_url",
            field=models.URLField(blank=True, max_length=2000, null=True),
        ),
    ]