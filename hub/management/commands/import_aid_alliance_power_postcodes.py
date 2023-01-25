from django.conf import settings

import pandas as pd

from hub.models import Area, AreaData, DataSet

from .base_importers import BaseAreaImportCommand


class Command(BaseAreaImportCommand):
    help = "Import Aid Alliance 'Power Postcode' data"

    message = "importing Aid Alliance 'power postcode' data"
    uses_gss = True
    cons_col = "gss"
    data_file = settings.BASE_DIR / "data" / "aid_alliance_power_postcodes.csv"

    power_postcodes = {
        "label": "Power Postcodes",
        "description": "Description of Aid Alliance 'Power Postcode' activist groups",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "source_label": "Aid Alliance",
        "source": "https://aidalliance.org.uk/",
        "source_type": "api",
        "data_url": "https://www.google.com/maps/d/u/0/viewer?mid=15b_tQI0t58rLcBTgFytu2e73jyKrrxFr",
        "table": "areadata",
        "default_value": {},
        "comparators": DataSet.comparators_default(),
        "is_filterable": False,
    }

    data_sets = {
        "power_postcodes": {
            "defaults": power_postcodes,
        }
    }

    def add_area(self, gss):
        if type(gss) == str:
            areas = Area.objects.filter(gss__in=gss.split(","))
            if len(areas) != 0:
                return areas[0].name
        return None

    def process_data(self):
        if not self._quiet:
            self.stdout.write(self.message)

        df = pd.read_csv(self.data_file)
        df.columns = [
            "group_name",
            "postcode",
            "community_organiser",
            "contact",
            "url",
            "gss",
        ]
        # Add Areas to df
        df["area"] = df.gss.apply(self.add_area)

        # Group by the area, and add the data from there
        for area_name, data in df.groupby("area"):
            try:
                area = Area.objects.get(name=area_name)
            except Area.DoesNotExist:
                continue

            json = []
            for index, row in data.iterrows():
                json.append(
                    row[["group_name", "community_organiser", "contact", "url"]]
                    .dropna()
                    .to_dict()
                )
            json_data, created = AreaData.objects.update_or_create(
                data_type=self.data_types["power_postcodes"],
                area=area,
                json=json,
            )

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(data_type=data_type).delete()

    def handle(self, quiet=False, *args, **kwargs):
        self._quiet = quiet
        self.add_data_sets()
        self.delete_data()
        self.process_data()
