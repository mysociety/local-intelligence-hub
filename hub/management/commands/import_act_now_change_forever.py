from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaAction, AreaActionData


class Command(BaseCommand):
    help = "Import Act Now Change Forever data"
    data_file = settings.BASE_DIR / "data" / "act_now.csv"

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.import_results()

    def get_df(self):

        if not self.data_file.exists():
            self.stderr.write(f"Data file {self.data_file} does not exist")
            return None

        df = pd.read_csv(
            self.data_file,
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
        for _, row in tqdm(df.iterrows()):
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
