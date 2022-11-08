from io import StringIO
from unittest import mock

from django.core.management import call_command
from django.test import TestCase

import pandas as pd

from hub.models import AreaData


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


class ImportIMDRUCTestCase(ImportTestCase):
    command = "import_imd_data"

    @mock.patch("hub.management.commands.import_imd_data.pd.read_csv")
    def test_import(self, patch_read_csv):
        data = {
            "gss-code": [
                "E10000001",
                "E10000002",
                "E40000002",
            ],
            "pcon-imd-pop-quintile": [1, 2, 2],
            "ruc-cluster-label": ["Urban", "Rural", "Urban"],
        }
        patch_read_csv.return_value = pd.DataFrame(data=data)
        out = self.call_command()

        self.assertEqual(
            out,
            "Failed to find area with code E40000002\nFailed to find area with code E40000002\n",
        )

        area_data = AreaData.objects.all()
        self.assertEqual(area_data.count(), 4)

        south_imd_data = AreaData.objects.filter(
            area__gss="E10000001", data_type__name="constituency_imd"
        ).all()

        self.assertEqual(south_imd_data[0].value(), 1)

        south_ruc_data = AreaData.objects.filter(
            area__gss="E10000001", data_type__name="constituency_ruc"
        ).all()

        self.assertEqual(south_ruc_data[0].value(), "Urban")
