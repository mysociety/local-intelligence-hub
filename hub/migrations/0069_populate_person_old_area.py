# Generated by Django 4.2.11 on 2024-07-03 13:01

from django.db import migrations


def populate_person_old_area(apps, schema_editor):
    Person = apps.get_model("hub", "Person")
    for p in Person.objects.all():
        p.old_area = p.area
        p.save()


def populate_person_area(apps, schema_editor):
    Person = apps.get_model("hub", "Person")
    for p in Person.objects.all():
        p.area = p.old_area
        p.save()


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0068_add_person_old_area"),
    ]

    operations = [
        migrations.RunPython(
            populate_person_old_area, reverse_code=populate_person_area
        )
    ]
