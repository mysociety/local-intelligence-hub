from django.conf import settings

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = "Generate CSV file of GBGW events with area name'"
    message = "Generating a CSV of areas for GBGW events"

    def add_arguments(self, parser):
        super().add_arguments(parser)

        parser.add_argument(
            "--year",
            type=int,
            required=True,
            action="store",
            help="The last two digits of the year for the events, e.g 24 for 2024",
        )

    def _setup(self, *args, **kwargs):
        self.year = kwargs["year"]

        self.data_file = settings.BASE_DIR / "data" / f"gbgw_events_{self.year}.csv"
        self.out_file = (
            settings.BASE_DIR / "data" / f"gbgw_events_{self.year}_processed.csv"
        )

        if self.year in (25, 26):
            self.row_name = "name"
            self.uses_postcodes = True
        else:
            self.row_name = "Organisation"

    def get_location_from_row(self, row):
        if self.year in (25, 26):
            return {"postcode": row["postcode"]}
        else:
            return {"lat_lon": [row.Lat, row.Long]}
