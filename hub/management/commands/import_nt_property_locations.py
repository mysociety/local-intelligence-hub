from django.conf import settings

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet

from .base_importers import BaseAreaImportCommand


class Command(BaseAreaImportCommand):
    help = "Import data about NT properties per constituency"
    data_file = settings.BASE_DIR / "data" / "national_trust_properties.csv"
    defaults = {
        "label": "National Trust properties",
        "description": "Names of National Trust properties",
        "data_type": "json",
        "category": "movement",
        "subcategory": "locations",
        "source_label": "National Trust",
        "source": "https://www.nationaltrust.org.uk/",
        "source_type": "json",
        "data_url": "",
        "table": "areadata",
        "default_value": {},
        "is_filterable": False,
        "comparators": DataSet.comparators_default(),
    }

    count_defaults = {
        "label": "Number of National Trust properties",
        "description": "Number of National Trust properties",
        "data_type": "integer",
        "category": "movement",
        "source_label": "National Trust",
        "source": "https://www.nationaltrust.org.uk/",
        "source_type": "json",
        "data_url": "",
        "table": "areadata",
        "default_value": 0,
        "is_filterable": True,
        "comparators": DataSet.numerical_comparators(),
    }

    data_sets = {
        "constituency_nt_properties": {
            "defaults": defaults,
        },
        "constituency_nt_properties_count": {
            "defaults": count_defaults,
        },
    }

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(data_type=data_type).delete()

    def handle(self, quiet=False, *args, **kwargs):
        self._quiet = quiet
        self.add_data_sets()
        self.delete_data()
        self.process_data()
        self.update_max_min()

    def process_data(self):
        df = pd.read_csv(self.data_file)
        # df.group_name = df.group_name.apply(
        # lambda x: x.split(" | ")[0] if type(x) == str else x
        # )

        if not self._quiet:
            self.stdout.write("Importing National Trust property data")

        # Group by the area, and add the data from there
        for area_name, data in tqdm(df.groupby("area")):
            try:
                area = Area.objects.get(name=area_name)
            except Area.DoesNotExist:
                continue

            json = []
            for index, row in data.iterrows():
                p_data = row[["name"]].dropna().to_dict()
                p_data[
                    "url"
                ] = f"https://www.nationaltrust.org.uk/site-search#gsc.q={row['name']}"
                json.append(p_data)

            json_data, created = AreaData.objects.update_or_create(
                data_type=self.data_types["constituency_nt_properties"],
                area=area,
                json=json,
            )

            count_data, creared = AreaData.objects.update_or_create(
                data_type=self.data_types["constituency_nt_properties_count"],
                area=area,
                data=len(data),
            )

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )
