# Generated by Django 4.2.10 on 2024-03-25 15:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0089_merge_20240321_1659"),
    ]

    operations = [
        migrations.AddField(
            model_name="mailchimpsource",
            name="member_email",
            field=models.EmailField(
                default="default@example.com",
                help_text="Email for member to fetch.",
                max_length=250,
            ),
        ),
    ]
