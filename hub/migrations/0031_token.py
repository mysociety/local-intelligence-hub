# Generated by Django 4.1.2 on 2023-03-21 17:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0030_dataset_subcategory"),
    ]

    operations = [
        migrations.CreateModel(
            name="Token",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("token", models.CharField(max_length=300)),
                ("domain", models.CharField(choices=[("user", "User")], max_length=50)),
                ("domain_id", models.IntegerField()),
            ],
        ),
    ]
