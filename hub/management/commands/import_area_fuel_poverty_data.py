from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType


class Command(BaseCommand):
    help = "Import data about area fuel poverty"

    data_url = "https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/1081191/sub-regional-fuel-poverty-2022-tables.xlsx"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = pd.read_excel(self.data_url, sheet_name="Table 4", skiprows=2)
        df = df.dropna(axis="index", how="any")

        data_set, created = DataSet.objects.get_or_create(
            name="constituency_fuel_poverty",
            data_type="float",
            source=self.data_url,
        )

        data_type, created = DataType.objects.get_or_create(
            data_set=data_set,
            name="fuel_poverty",
            data_type="float",
            label="Percentage houses in fuel poverty",
        )

        total = 0
        count = 0
        if not self._quiet:
            self.stdout.write("Importing constituency fuel poverty data")
        for index, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            gss = row["Parliamentary Constituency Code"]

            total += float(row["Proportion of households fuel poor (%)"])
            count += 1

            try:
                area = Area.objects.get(gss=gss)
            except Area.DoesNotExist:
                print(f"Failed to find area with code {gss}")
                continue

            AreaData.objects.get_or_create(
                data_type=data_type,
                area=area,
                data=row["Proportion of households fuel poor (%)"],
            )

        average = total / count
        data_type.average = average
        data_type.save()
