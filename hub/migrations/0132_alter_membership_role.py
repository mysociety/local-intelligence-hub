# Generated by Django 4.2.11 on 2024-06-17 12:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0131_alter_userproperties_user"),
    ]

    operations = [
        migrations.AlterField(
            model_name="membership",
            name="role",
            field=models.CharField(default="owner", max_length=250),
        ),
    ]