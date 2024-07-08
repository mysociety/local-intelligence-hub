# Generated by Django 4.2.11 on 2024-07-08 09:27

from django.db import migrations


def populate_person_dataset_person_type(apps, schema_editor):
    DataSet = apps.get_model("hub", "DataSet")
    for d in DataSet.objects.filter(table="people__persondata"):
        d.person_type = "MP"
        d.save()


def reverse_noop(apps, schema_editor):  # pragma: no cover
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0072_dataset_person_type_alter_dataset_table"),
    ]

    operations = [
        migrations.RunPython(
            populate_person_dataset_person_type, reverse_code=reverse_noop
        )
    ]
