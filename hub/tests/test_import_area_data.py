from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

import pandas as pd

from hub.management.commands.base_importers import BaseAreaImportCommand
from hub.models import Area, AreaData, DataSet, DataType


class ImportTestCase(TestCase):
    fixtures = ["areas.json"]

    def call_command(self, quiet=True, *args, **kwargs):
        out = StringIO()
        call_command(
            self.command,
            quiet=quiet,
            *args,
            stdout=out,
            stderr=StringIO(),
            **kwargs,
        )
        return out.getvalue()


class ImportNumericalDataWithMissingValuesTestCase(TestCase):
    def setUp(self):
        self.command = BaseAreaImportCommand()
        self.command.data_sets = {
            "data_type_1": {
                "defaults": {
                    "label": "Data Type 1",
                    "description": "",
                    "data_type": "percent",
                    "category": "",
                    "source_label": "",
                    "source": "",
                    "source_type": "",
                    "data_url": "",
                    "table": "areadata",
                    "comparators": DataSet.numerical_comparators(),
                    "default_value": 10,
                },
            }
        }
        for i, area_name in enumerate("ABCD"):
            Area.objects.create(
                mapit_id=i,
                gss=i,
                name=area_name,
                area_type="WMC",
            )

        self.command.add_data_sets()
        AreaData.objects.create(
            area=Area.objects.get(mapit_id=0),
            data_type=DataType.objects.get(label="Data Type 1"),
            data=1,
        )
        AreaData.objects.create(
            area=Area.objects.get(mapit_id=1),
            data_type=DataType.objects.get(label="Data Type 1"),
            data=1,
        )

    def test_missing_data_average(self):
        # Check that the average includes 0s from areas which didn't get given a value from
        # the data import
        self.command.update_averages()
        self.assertEqual(DataType.objects.get(label="Data Type 1").average, 0.5)

    def test_missing_data_count(self):
        self.command.update_averages()
        # Check that an AreaData object has been created for every single Area
        self.assertEqual(
            AreaData.objects.filter(data_type__label="Data Type 1").count(),
            Area.objects.all().count(),
        )


class ImportAgeDataTestCase(ImportTestCase):
    command = "import_area_age_data"

    @mock.patch("hub.management.commands.import_area_age_data.pd.read_excel")
    def test_import(self, patch_read_excel):
        data = {
            "Age group": ["0-9", "0-9", "10-19", "10-19", "0-9", "0-9"],
            "ONSConstID": [
                "E10000001",
                "E10000002",
                "E10000001",
                "E10000002",
                "E10000001",
                "E40000001",
            ],
            "Const%": [0.123, 0.132, 0.095, 0.144, 0.155, 0.1],
            "Date": [2020, 2020, 2020, 2020, 2021, 2020],
            "UK%": [0.151, 0.151, 0.161, 0.161, 0.111, 0.2],
        }
        patch_read_excel.return_value = pd.DataFrame(data=data)
        out = self.call_command()

        self.assertEqual(out, "Failed to find area with code E40000001\n")
        area_data = AreaData.objects.all()
        self.assertEqual(area_data.count(), 4)

        south_data = (
            AreaData.objects.filter(area__gss="E10000001")
            .order_by("data_type__name")
            .all()
        )

        self.assertEqual(south_data[0].value(), 12.3)
        self.assertEqual(south_data[1].value(), 9.5)

        self.assertEqual(south_data[0].data_type.average, 15.1)
        self.assertEqual(south_data[1].data_type.average, 16.1)


class ImportFuelPovertyDataTestCase(ImportTestCase):
    command = "import_area_fuel_poverty_data"

    @mock.patch("hub.management.commands.import_area_age_data.pd.read_excel")
    def test_import(self, patch_read_excel):
        data = {
            "Parliamentary Constituency Code": [
                "E10000001",
                "E10000002",
                "E40000002",
            ],
            "Proportion of households fuel poor (%)": [12.1, 13.2, 14.2],
        }
        patch_read_excel.return_value = pd.DataFrame(data=data)
        out = self.call_command()

        self.assertEqual(out, "Failed to find area with code E40000002\n")

        area_data = AreaData.objects.all()
        self.assertEqual(area_data.count(), 2)

        south_data = (
            AreaData.objects.filter(area__gss="E10000001")
            .order_by("data_type__name")
            .all()
        )

        self.assertEqual(south_data[0].value(), 12.1)

        self.assertEqual(south_data[0].data_type.average, 12.65)


class ImportIMDTestCase(ImportTestCase):
    command = "import_imd_data"

    @mock.patch("hub.management.commands.import_ruc_data.pd.read_csv")
    def test_import_imd(self, patch_read_csv):
        data = {
            "gss-code": [
                "E10000001",
                "E10000002",
                "E40000002",
            ],
            "pcon-imd-pop-quintile": [1, 2, 2],
        }
        patch_read_csv.return_value = pd.DataFrame(data=data)
        out = self.call_command()

        self.assertEqual(
            out,
            "Failed to find area with code E40000002\n",
        )

        area_data = AreaData.objects.all()
        self.assertEqual(area_data.count(), 2)

        south_imd_data = AreaData.objects.filter(
            area__gss="E10000001", data_type__name="constituency_imd"
        ).all()

        self.assertEqual(south_imd_data[0].value(), 1)


class ImportRUCTestCase(ImportTestCase):
    command = "import_ruc_data"

    @mock.patch("hub.management.commands.import_imd_data.pd.read_csv")
    def test_import_ruc(self, patch_read_csv):
        data = {
            "gss-code": [
                "E10000001",
                "E10000002",
                "E40000002",
            ],
            "ruc-cluster-label": ["Urban", "Rural", "Urban"],
        }
        patch_read_csv.return_value = pd.DataFrame(data=data)
        out = self.call_command()

        self.assertEqual(
            out,
            "Failed to find area with code E40000002\n",
        )

        area_data = AreaData.objects.all()
        self.assertEqual(area_data.count(), 2)

        south_ruc_data = AreaData.objects.filter(
            area__gss="E10000001", data_type__name="constituency_ruc"
        ).all()

        self.assertEqual(south_ruc_data[0].value(), "Urban")
