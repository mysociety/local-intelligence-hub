from django.conf import settings

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of GBGW 2022 events"
    message = "Generating a CSV of areas for 2022 GBGW events"

    data_file = settings.BASE_DIR / "data" / "gbgw_events.csv"
    out_file = settings.BASE_DIR / "data" / "gbgw_events_processed.csv"
    row_name = "Organisation name"

    def get_location_from_row(self, row):
        return {"lat_lon": [row["Latitude"], row["Longitude"]]}
