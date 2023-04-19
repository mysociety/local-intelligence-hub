from django.core.management.base import BaseCommand

from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType
from utils.mapit import MapIt


class Command(BaseCommand):
    help = "Import countries of areas from MapIt"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        data_type = self.create_data_type()
        self.delete_data(data_type)
        self.import_data(data_type)

    def create_data_type(self):
        options = [
            {"title": "England", "shader": "#f8f9fa"},
            {"title": "Wales", "shader": "#cc3517"},
            {"title": "Scotland", "shader": "#202448"},
            {"title": "Northern Ireland", "shader": "#458945"},
        ]
        countries_ds, created = DataSet.objects.update_or_create(
            name="country",
            defaults={
                "data_type": "text",
                "description": "The country that the constituency is in",
                "label": "Country of the UK",
                "source_label": "MapIt",
                "source": "https://mapit.mysociety.org/",
                "table": "areadata",
                "options": options,
                "comparators": DataSet.in_comparators(),
            },
        )

        countries, created = DataType.objects.update_or_create(
            data_set=countries_ds,
            name="country",
            defaults={"data_type": "text"},
        )

        return countries

    def import_data(self, data_type):
        mapit = MapIt()
        areas = mapit.areas_of_type([area.mapit_id for area in Area.objects.all()])
        for area in tqdm(areas, disable=self._quiet):
            data, created = AreaData.objects.update_or_create(
                area=Area.objects.get(mapit_id=area["id"]),
                data_type=data_type,
                data=area["country_name"],
            )

    def delete_data(self, data_type):
        AreaData.objects.filter(data_type=data_type).delete()
