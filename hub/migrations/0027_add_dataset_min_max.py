# Generated by Django 4.1.2 on 2022-12-08 09:52

from django.db import migrations, models


def update_min_max(apps, schemaeditor):  # pragma: no cover
    DataType = apps.get_model("hub", "DataType")
    AreaData = apps.get_model("hub", "AreaData")
    PersonData = apps.get_model("hub", "PersonData")

    for data_type in DataType.objects.filter(
        data_type__in=("integer", "float", "percent")
    ):
        data_set = data_type.data_set

        if data_set.table == "areadata":
            scope = AreaData
        else:
            scope = PersonData

        field = "int"
        if data_type.data_type != "integer":
            field = "float"

        max = scope.objects.filter(data_type=data_type).aggregate(models.Max(field))
        min = scope.objects.filter(data_type=data_type).aggregate(models.Min(field))

        data_type.maximum = max[f"{field}__max"]
        data_type.minimum = min[f"{field}__min"]
        data_type.save()


def reverse_noop(apps, schema_editor):  # pragma: no cover
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0026_areadata_json_persondata_json_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="datatype",
            name="maximum",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="datatype",
            name="minimum",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.RunPython(update_min_max, reverse_noop),
    ]