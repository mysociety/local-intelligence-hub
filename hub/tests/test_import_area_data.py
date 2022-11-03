from unittest import mock

from django.core.management import call_command
from django.test import TestCase

import pandas as pd

from hub.models import AreaData


class ImportAgeDataTestCase(TestCase):
    fixtures = ["areas.json"]

    @mock.patch("hub.management.commands.import_area_age_data.pd.read_excel")
    def test_import(self, patch_read_excel):
        data = {
            "Age group": ["0-9", "0-9", "10-19", "10-19", "0-9"],
            "ONSConstID": [
                "E10000001",
                "E10000002",
                "E10000001",
                "E10000002",
                "E10000001",
            ],
            "Const%": [0.123, 0.132, 0.095, 0.144, 0.155],
            "Date": [2020, 2020, 2020, 2020, 2021],
            "UK%": [0.151, 0.151, 0.161, 0.161, 0.111],
        }
        patch_read_excel.return_value = pd.DataFrame(data=data)
        call_command("import_area_age_data")

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
