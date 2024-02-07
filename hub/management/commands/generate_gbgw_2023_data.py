from django.conf import settings

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of GBGW 2023 events with area name'"

    data_file = settings.BASE_DIR / "data" / "gbgw_events_23.csv"
    out_file = settings.BASE_DIR / "data" / "gbgw_events_23_processed.csv"
    row_name = "Organisation"

    def get_lat_lon_from_row(self, row):
        return row.Lat, row.Long
