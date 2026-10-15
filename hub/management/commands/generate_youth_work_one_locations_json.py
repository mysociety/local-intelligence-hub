import json
from pathlib import Path

from django.conf import settings

import pandas as pd

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = "Geocode Youth Work One national organisation locations to GSS codes"
    message = "Geocoding Youth Work One organisation locations"

    data_file = settings.BASE_DIR / "data" / "youth-work-one-org-locations.json"
    out_file = settings.BASE_DIR / "data" / "youth-work-one-org-locations-geocoded.json"

    row_name = "orgName"
    uses_gss = True
    cols = ["WMC23", "STC", "DIS"]

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )
        parser.add_argument(
            "-i",
            "--input",
            action="store",
            default=str(self.data_file),
            help="JSON file of locations to geocode.",
        )
        parser.add_argument(
            "-o",
            "--output",
            action="store",
            default=str(self.out_file),
            help="JSON file to write geocoded locations to.",
        )

    def _setup(self, *args, **options):
        self.data_file = Path(options["input"])
        self.out_file = Path(options["output"])

    def get_dataframe(self):
        with open(self.data_file) as f:
            raw = json.load(f)

        # The original source file wraps its rows in a "data" key, but a
        # previously-geocoded file (written by save_data, below) is just a
        # flat list of rows - support re-running against either.
        rows = raw["data"] if isinstance(raw, dict) else raw

        df = pd.DataFrame(rows)

        # nationalOrgId 0 has no corresponding entry in
        # youth-work-one-national-orgs.json - it's unclassifiable, so drop it.
        df = df[df["nationalOrgId"] != 0]

        return df

    def get_location_from_row(self, row):
        return {"lat_lon": [row["latitude"], row["longitude"]]}

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write("Generating Area details from location values")

        # Only geocode rows that don't already have at least one area code -
        # so re-running against a previously-geocoded file only retries the
        # locations that failed last time, rather than starting from scratch.
        existing_cols = [col for col in self.cols if col in df.columns]
        if existing_cols:
            needs_geocoding = df[existing_cols].isna().all(axis=1)
        else:
            needs_geocoding = pd.Series(True, index=df.index)

        to_geocode = df[needs_geocoding].drop(columns=existing_cols)
        already_done = df[~needs_geocoding]

        if not self._quiet:
            self.stdout.write(
                f"{len(to_geocode)} locations need geocoding "
                f"({len(already_done)} already have area data)"
            )

        if to_geocode.empty:
            geocoded = to_geocode
        else:
            geocoded = to_geocode.join(
                to_geocode.progress_apply(
                    lambda row: self.process_location(
                        row_name=row[self.row_name], **self.get_location_from_row(row)
                    ),
                    axis=1,
                )
            )

        return pd.concat([already_done, geocoded]).sort_index()

    def save_data(self, df):
        df = df.drop(columns=[self.legacy_col], errors="ignore")
        df.to_json(self.out_file, orient="records")
