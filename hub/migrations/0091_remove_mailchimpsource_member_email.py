# Generated by Django 4.2.10 on 2024-03-27 19:45

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0090_mailchimpsource_member_email"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="mailchimpsource",
            name="member_email",
        ),
    ]
