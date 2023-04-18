import json

from django.conf import settings

from hub.models import Area, AreaData

from .base_importers import BaseAreaImportCommand


class Command(BaseAreaImportCommand):
    help = "Import popular petition data"

    data_file = settings.BASE_DIR / "data" / "petitions.json"
    message = "Importing petition data"
    data_sets = {
        "constituency_popular_petitions": {
            "defaults": {
                "source": "https://petition.parliament.uk/",
                "source_label": "UK Government and Parliament Petitions",
                "name": "constituency_popular_petitions",
                "description": "Popular petitions",
                "label": "Popular petitions",
                "data_type": "json",
                "category": "place",
                "source_type": "json",
                "table": "areadata",
                "is_filterable": False,
            },
        }
    }

    def process_data(self):
        if not self._quiet:
            self.stdout.write(self.message)

        data_type = self.data_types["constituency_popular_petitions"]

        with open(self.data_file) as input:
            data = json.load(input)

            for gss, petitions in data.items():
                try:
                    area = Area.objects.get(gss=gss)
                except Area.DoesNotExist:
                    self.stdout(f"Failed to find ares with code {gss}")
                    continue

                data, created = AreaData.objects.update_or_create(
                    data_type=data_type,
                    area=area,
                    defaults={"json": petitions},
                )

    def handle(self, quiet=False, *args, **kwargs):
        self._quiet = quiet
        self.add_data_sets()
        self.delete_data()
        self.process_data()
