# Generated by Django 4.1.2 on 2022-11-09 16:46

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0015_data_set_categories_etc"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="dataset",
            options={
                "permissions": [
                    ("order_and_feature", "Can change sort order and mark as featured")
                ]
            },
        ),
    ]
