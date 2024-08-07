# Generated by Django 4.2.11 on 2024-07-03 10:36

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0067_populate_person_areas"),
    ]

    operations = [
        migrations.AlterField(
            model_name="person",
            name="area",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="hub.area",
            ),
        ),
        migrations.AddField(
            model_name="person",
            name="old_area",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="hub.area",
            ),
        ),
    ]
