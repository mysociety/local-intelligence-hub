# Generated by Django 4.1.2 on 2023-08-03 13:50

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0045_remove_area_type"),
    ]

    operations = [
        migrations.AlterField(
            model_name="area",
            name="area_type",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="hub.areatype",
            ),
        ),
    ]
