# Generated by Django 4.2.11 on 2024-05-28 11:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0116_alter_externaldatasource_deduplication_hash"),
    ]

    operations = [
        migrations.AlterField(
            model_name="area",
            name="gss",
            field=models.CharField(max_length=30),
        ),
    ]