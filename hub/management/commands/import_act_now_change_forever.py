from django.conf import settings

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaAction, AreaActionData

from .base_importers import BaseImportCommand


class Command(BaseImportCommand):
    help = "Import Act Now Change Forever data"
    data_file = settings.BASE_DIR / "data" / "act_now.csv"

    def add_arguments(self, parser):
        super(Command, self).add_arguments(parser)

        parser.add_argument(
            "-u", "--url", action="store", help="URL to Google Sheets CSV export."
        )

    def handle(self, *args, **options):
        super(Command, self).handle(*args, **options)
        self.csv_url = options.get("url")
        self.import_results()

    def get_df(self):
        if self.csv_url:
            dataframe_source_filepath = self.csv_url
        elif self.data_file.exists():
            dataframe_source_filepath = self.data_file
        else:
            self.stderr.write(
                f"No URL provided, and data file {self.data_file} does not exist"
            )
            return None

        if not self._quiet:
            self.stdout.write(
                f"Reading Mass Lobby details from {dataframe_source_filepath}"
            )

        df = pd.read_csv(
            dataframe_source_filepath,
            usecols=[
                "gss_code",
                "MP Meeting Time",
                "Venue",
                "Address",
                "Where to go",
                "Arrival time",
            ],
        )
        df.columns = [
            "gss_code",
            "time_slot",
            "venue",
            "address",
            "directions",
            "arrival_time",
        ]
        df = df.fillna("")
        return df

    def import_results(self):
        df = self.get_df()

        if df is None or df.empty:
            return

        action, _ = AreaAction.objects.update_or_create(
            name="2025_tcc_act_now",
            defaults={
                "label": "Act Now, Change Forever",
                "require_session": True,
                "is_public": False,
                "visible": True,
                "template": "_act_now.html",
            },
        )
        for _, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            a = Area.objects.get(gss=row["gss_code"], area_type__code="WMC23")

            AreaActionData.objects.update_or_create(
                area=a,
                action=action,
                defaults={
                    "data": {
                        "time_slot": row["time_slot"],
                        "venue": row["venue"],
                        "address": row["address"],
                        "directions": row["directions"],
                        "arrival_time": row["arrival_time"],
                    },
                },
            )
