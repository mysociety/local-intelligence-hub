from django.conf import settings

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of WI Groups'"

    data_file = settings.BASE_DIR / "data" / "gbgw_events.csv"
    out_file = settings.BASE_DIR / "data" / "gbgw_events_processed.csv"
    row_name = "Organisation name"

    def get_lat_lon_from_row(self, row):
        return row.Latitude, row.Longitude
