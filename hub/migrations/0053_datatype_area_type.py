# Generated by Django 4.1.2 on 2023-09-07 10:10

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0058_areaoverlap_area_overlaps"),
    ]

    operations = [
        migrations.AddField(
            model_name="datatype",
            name="area_type",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="hub.areatype",
            ),
        ),
    ]
