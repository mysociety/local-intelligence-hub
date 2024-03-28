# Generated by Django 4.2.10 on 2024-03-25 19:31

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0092_alter_area_area_type_alter_areadata_area_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="SharingPermission",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("last_update", models.DateTimeField(auto_now=True)),
                (
                    "visibility_record_coordinates",
                    models.BooleanField(blank=True, default=False, null=True),
                ),
                (
                    "visibility_record_details",
                    models.BooleanField(blank=True, default=False, null=True),
                ),
                (
                    "external_data_source",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="hub.externaldatasource",
                    ),
                ),
                (
                    "organisation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to="hub.organisation",
                    ),
                ),
            ],
            options={
                "unique_together": {("external_data_source", "organisation")},
            },
        ),
        migrations.AddField(
            model_name="externaldatasource",
            name="sharing_permissions",
            field=models.ManyToManyField(
                related_name="sources_from_other_orgs",
                through="hub.SharingPermission",
                to="hub.organisation",
            ),
        ),
    ]
