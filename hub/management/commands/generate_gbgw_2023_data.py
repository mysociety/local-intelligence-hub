from django.conf import settings

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of GBGW 2023 events with area name'"
    message = "Generating a CSV of areas for 2022 GBGW events"

    data_file = settings.BASE_DIR / "data" / "gbgw_events_23.csv"
    out_file = settings.BASE_DIR / "data" / "gbgw_events_23_processed.csv"
    row_name = "Organisation"

    def get_location_from_row(self, row):
        return {"lat_lon": [row.Lat, row.Long]}
