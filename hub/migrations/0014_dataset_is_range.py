# Generated by Django 4.1.2 on 2022-11-03 15:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0013_datatype_average_datatype_label"),
    ]

    operations = [
        migrations.AddField(
            model_name="dataset",
            name="is_range",
            field=models.BooleanField(default=False),
        ),
    ]