# Generated by Django 4.2.5 on 2023-12-14 15:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0058_areaoverlap_area_overlaps"),
    ]

    operations = [
        migrations.AddField(
            model_name="person",
            name="end_date",
            field=models.DateField(null=True),
        ),
        migrations.AddField(
            model_name="person",
            name="start_date",
            field=models.DateField(null=True),
        ),
    ]