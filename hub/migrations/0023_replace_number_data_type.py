# Generated by Django 4.1.2 on 2022-12-01 12:49

from django.db import migrations

from hub.models import DataSet, DataType


def number_to_integer(apps, schema_editor):
    DataSet.objects.filter(name="mp_election_majority").update(data_type="integer")
    DataType.objects.filter(name="mp_election_majority").update(data_type="integer")


def integer_to_number(apps, schema_editor):
    DataSet.objects.filter(name="mp_election_majority").update(data_type="number")
    DataType.objects.filter(name="mp_election_majority").update(data_type="number")


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0022_userdatasets"),
    ]

    operations = [migrations.RunPython(number_to_integer, integer_to_number)]
