# Generated by Django 4.2.10 on 2024-04-02 17:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0095_merge_20240328_1835"),
    ]

    operations = [
        migrations.AlterField(
            model_name="genericdata",
            name="postcode",
            field=models.CharField(blank=True, max_length=1000, null=True),
        ),
    ]
