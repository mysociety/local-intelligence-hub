import re
from time import sleep

import requests
from tqdm import tqdm

from hub.models import AreaData

from .base_importers import BaseLatLongImportCommand


class Command(BaseLatLongImportCommand):
    help = "Import data about number WI groups of per constituency"

    defaults = {
        "label": "Number of Women’s Institute groups",
        "description": "Number of Women’s Institute groups",
        "data_type": "integer",
        "category": "movement",
        "source_label": "Woman’s Institute",
        "source": "https://www.thewi.org.uk/",
        "source_type": "api",
        "data_url": "https://wi-search.squiz.cloud/s/search.json?collection=nfwi-federations&profile=_default&query=!null&sort=prox&sort=prox&start_rank=1&origin=54.093409,-2.89479&maxdist=9999&num_ranks=9999",
    }

    data_sets = {
        "constituency_wi_group_count": {
            "defaults": defaults,
        },
    }

    def get_api_results(self):
        results = requests.get(self.data_type.data_set.data_url)

        data = results.json()["response"]["resultPacket"]["results"]

        return data

    def delete_data(self):
        for data_type in self.data_types.values():
            AreaData.objects.filter(data_type=data_type).delete()

    def process_data(self):
        self.data_type = self.data_types["constituency_wi_group_count"]

        if not self._quiet:
            self.stdout.write("Importing women's institute group data")
        data = self.get_api_results()
        count = 0
        for row in tqdm(data, disable=self._quiet):
            count += 1
            lat_long = row["metaData"]["x"]
            try:
                lat, lon = re.split(r"[,;]", lat_long)
            except ValueError:
                print(f"bad lat_lon for row {row['title']} - {lat_long}")
                continue

            self.process_lat_long(lat=lat, lon=lon, row_name=row["title"])

            if count > 0 and count % 50 == 0:
                sleep(10)

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.delete_data()
        self.add_data_sets()
        self.process_data()
        self.update_averages()
