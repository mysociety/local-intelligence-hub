# Generated by Django 4.1.2 on 2023-04-03 16:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0033_userproperties_full_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="userproperties",
            name="account_confirmed",
            field=models.BooleanField(default=False),
        ),
    ]