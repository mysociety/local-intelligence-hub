# Generated by Django 4.2.11 on 2025-02-07 14:06

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0157_batchrequest_source"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="genericdata",
            unique_together={("data_type", "data")},
        ),
    ]
