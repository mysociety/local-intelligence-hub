from datetime import date

from django.conf import settings

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet

from .base_importers import BaseAreaImportCommand


class Command(BaseAreaImportCommand):
    help = "Import data about WI groups per constituency"
    data_file = settings.BASE_DIR / "data" / "wi_groups.csv"
    defaults = {
        "label": "Women’s Institute groups",
        "description": "Descriptions of Women's Institute Groups",
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "release_date": str(date.today()),
        "source_label": "Data from the WI.",
        "source": "https://www.thewi.org.uk/",
        "source_type": "api",
        "data_url": "https://wi-search.squiz.cloud/s/search.json?collection=nfwi-federations&profile=_default&query=!null&sort=prox&sort=prox&start_rank=1&origin=54.093409,-2.89479&maxdist=9999&num_ranks=9999",
        "table": "areadata",
        "default_value": {},
        "exclude_countries": ["Scotland"],
        "is_filterable": False,
        "is_shadable": False,
        "comparators": DataSet.comparators_default(),
    }

    count_defaults = {
        "label": "Number of Women’s Institute groups",
        "description": "Number of Women's Institute Groups",
        "data_type": "integer",
        "category": "movement",
        "release_date": str(date.today()),
        "source_label": "Data from the WI.",
        "source": "https://www.thewi.org.uk/",
        "source_type": "api",
        "data_url": "https://wi-search.squiz.cloud/s/search.json?collection=nfwi-federations&profile=_default&query=!null&sort=prox&sort=prox&start_rank=1&origin=54.093409,-2.89479&maxdist=9999&num_ranks=9999",
        "table": "areadata",
        "default_value": 0,
        "exclude_countries": ["Scotland"],
        "is_filterable": True,
        "comparators": DataSet.numerical_comparators(),
        "unit_type": "point",
        "unit_distribution": "point",
    }

    data_sets = {
        "constituency_wi_groups": {
            "defaults": defaults,
        },
        "constituency_wi_group_count": {
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
        self.update_averages()
        self.update_max_min()

    def process_data(self):
        df = pd.read_csv(self.data_file)
        df.group_name = df.group_name.apply(
            lambda x: x.split(" | ")[0] if isinstance(x, str) else x
        )

        if not self._quiet:
            self.stdout.write("Importing women's institute group data")

        # Group by the area, and add the data from there
        area_type = self.get_area_type()
        for area_name, data in tqdm(df.groupby("area")):
            try:
                area = Area.objects.get(name=area_name, area_type=area_type)
            except Area.DoesNotExist:
                continue

            json = []
            for index, row in data.iterrows():
                json.append(row[["group_name", "url"]].dropna().to_dict())

            json_data, created = AreaData.objects.update_or_create(
                data_type=self.data_types["constituency_wi_groups"],
                area=area,
                json=json,
            )

            count_data, creared = AreaData.objects.update_or_create(
                data_type=self.data_types["constituency_wi_group_count"],
                area=area,
                data=len(data),
            )

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )
