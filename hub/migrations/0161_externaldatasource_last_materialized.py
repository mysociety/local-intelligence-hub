# Generated by Django 4.2.11 on 2025-02-13 18:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0160_genericdata_parsed_json"),
    ]

    operations = [
        migrations.AddField(
            model_name="externaldatasource",
            name="last_materialized",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
