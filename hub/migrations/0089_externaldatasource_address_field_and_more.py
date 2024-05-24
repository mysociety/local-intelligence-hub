# Generated by Django 4.2.10 on 2024-03-20 12:22

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0088_area_point_area_polygon_alter_genericdata_polygon"),
    ]

    operations = [
        migrations.AddField(
            model_name="externaldatasource",
            name="address_field",
            field=models.CharField(blank=True, max_length=250, null=True),
        ),
        migrations.AddField(
            model_name="externaldatasource",
            name="email_field",
            field=models.CharField(blank=True, max_length=250, null=True),
        ),
        migrations.AddField(
            model_name="externaldatasource",
            name="first_name_field",
            field=models.CharField(blank=True, max_length=250, null=True),
        ),
        migrations.AddField(
            model_name="externaldatasource",
            name="full_name_field",
            field=models.CharField(blank=True, max_length=250, null=True),
        ),
        migrations.AddField(
            model_name="externaldatasource",
            name="last_name_field",
            field=models.CharField(blank=True, max_length=250, null=True),
        ),
        migrations.AddField(
            model_name="externaldatasource",
            name="phone_field",
            field=models.CharField(blank=True, max_length=250, null=True),
        ),
        migrations.AddField(
            model_name="externaldatasource",
            name="postcode_field",
            field=models.CharField(blank=True, max_length=250, null=True),
        ),
    ]