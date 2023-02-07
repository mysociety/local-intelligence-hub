from django.conf import settings

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet

from .base_importers import BaseLatLongImportCommand


class Command(BaseLatLongImportCommand):
    help = "Import data about FOE groups by constituency"

    data_file = settings.BASE_DIR / "data" / "foe_groups.csv"
    message = "Importing FOE groups data"
    uses_gss = False

    defaults = {
        "data_type": "json",
        "category": "movement",
        "subcategory": "groups",
        "label": "Active Friends of the Earth groups",
        "description": "Active Friends of the Earth groups by constituency",
        "source_label": "Friends of the Earth",
        "source": "https://friendsoftheearth.uk/",
        "source_type": "google sheet",
        "table": "areadata",
        "default_value": {},
        "data_url": "",
        "is_filterable": False,
        "comparators": DataSet.comparators_default,
    }

    data_sets = {
        "constituency_foe_groups": {
            "defaults": defaults,
        },
    }

    def get_dataframe(self):
        df = pd.read_csv(
            self.data_file,
            usecols=["Westminster constituency", "Groups located within constituency"],
        )
        df = df.dropna()
        df.columns = ["constituency", "groups"]
        df = (
            df.groupby("constituency")
            .apply(lambda x: [{"group_name": group, "url": ""} for group in x.groups])
            .reset_index()
            .rename(columns={0: "groups"})
        )
        return df

    def process_data(self):
        df = self.get_dataframe()

        if not self._quiet:
            self.stdout.write("Importing Friends of the Earth group data")

        for index, row in tqdm(df.iterrows(), disable=self._quiet):
            json_data, created = AreaData.objects.update_or_create(
                data_type=self.data_types["constituency_foe_groups"],
                area=Area.objects.get(name=row.constituency),
                json=row.groups,
            )

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.add_data_sets()
        self.delete_data()
        self.process_data()

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types.values()).delete()
