from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, DataSet, Person


class Command(BaseCommand):
    help = "Generate CSV file of all datasets in the site."

    out_file = settings.BASE_DIR / "data" / "dataset_list.csv"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.build_dataframe()
        df.to_csv(self.out_file)

    def get_area_data(self):
        area_details = []
        for area in Area.objects.filter(area_type__code="WMC"):
            try:
                mp = Person.objects.get(area=area)
            except Person.DoesNotExist:
                print(f"Person does not exist for area {area.gss} {area.name}")
            area_details.append([area.gss, area.name, area.mapit_id, mp.name])
        return pd.DataFrame(
            area_details,
            columns=["Area GSS code", "Area name", "Area MapIt ID", "MP name"],
        ).set_index("Area GSS code")

    def create_dataset_df(self, data, label, table):
        df_data = []
        for datum in data:
            if table == "areadata":
                area = datum.area
            else:
                area = datum.person.area
            df_data.append([area.gss, datum.value()])
        df = pd.DataFrame(df_data, columns=["Area GSS code", label])
        # Deal with any multiples, by concatenating them into one string
        df = df.groupby("Area GSS code").agg(
            {
                "Area GSS code": "first",
                label: lambda data_list: ", ".join([str(x) for x in data_list]),
            }
        )
        df = df.set_index("Area GSS code")
        return df

    def build_dataframe(self):
        # Next, iterate through each (filterable) data set in the db
        datasets = []
        for data_set in tqdm(
            DataSet.objects.filter().order_by("-category", "source"),
            disable=self._quiet,
        ):
            areas_available = [a.code for a in data_set.areas_available.all()]

            datasets.append(
                [
                    data_set.label,
                    data_set.description,
                    data_set.source,
                    data_set.category,
                    data_set.is_public,
                    "WMC" in areas_available,
                    "WMC23" in areas_available,
                ]
            )

        df = pd.DataFrame(
            datasets,
            columns=[
                "Name",
                "Description",
                "Source",
                "Category",
                "Public",
                "2010 Cons",
                "2024 Cons",
            ],
        )
        return df
