# Generated by Django 4.2.11 on 2024-05-26 22:57

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0113_alter_hubcontentpage_puck_json_content"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="hubhomepage",
            name="custom_domain",
        ),
    ]
