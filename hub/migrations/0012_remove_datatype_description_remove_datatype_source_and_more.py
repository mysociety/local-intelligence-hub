# Generated by Django 4.1.2 on 2022-11-03 12:13

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0011_create_datasets_from_types"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="datatype",
            name="description",
        ),
        migrations.RemoveField(
            model_name="datatype",
            name="source",
        ),
        migrations.AlterField(
            model_name="datatype",
            name="data_set",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, to="hub.dataset"
            ),
        ),
    ]
