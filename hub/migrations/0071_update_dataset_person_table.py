# Generated by Django 4.2.11 on 2024-07-03 13:01

from django.db import migrations


def update_table_to_people(apps, schema_editor):
    DataSet = apps.get_model("hub", "DataSet")
    for d in DataSet.objects.filter(table="person__persondata"):
        d.table = "people__persondata"
        d.save()


def update_table_to_person(apps, schema_editor):
    DataSet = apps.get_model("hub", "DataSet")
    for d in DataSet.objects.filter(table="people__persondata"):
        d.table = "person__persondata"
        d.save()


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0070_remove_person_area"),
    ]

    operations = [
        migrations.RunPython(
            update_table_to_people, reverse_code=update_table_to_person
        )
    ]
