# Generated by Django 4.2.10 on 2024-03-24 00:53

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0091_genericdata_last_update_alter_genericdata_address_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="area",
            name="area_type",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="areas",
                to="hub.areatype",
            ),
        ),
        migrations.AlterField(
            model_name="areadata",
            name="area",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="data",
                to="hub.area",
            ),
        ),
        migrations.AlterField(
            model_name="dataset",
            name="external_data_source",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="data_sets",
                to="hub.externaldatasource",
            ),
        ),
        migrations.AlterField(
            model_name="datatype",
            name="area_type",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="data_types",
                to="hub.areatype",
            ),
        ),
        migrations.AlterField(
            model_name="datatype",
            name="data_set",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="data_types",
                to="hub.dataset",
            ),
        ),
        migrations.AlterField(
            model_name="person",
            name="area",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="people",
                to="hub.area",
            ),
        ),
        migrations.AlterField(
            model_name="persondata",
            name="person",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="data",
                to="hub.person",
            ),
        ),
    ]
