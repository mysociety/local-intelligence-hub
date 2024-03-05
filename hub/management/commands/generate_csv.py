from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Generate CSV file of all filterable datasets in the site."

    out_file = settings.BASE_DIR / "data" / "data_dump.csv"

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
        for area in Area.objects.filter(area_type="WMC"):
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
        # Build a list of dataframes (one for each data-type), starting with the area data
        dfs_list = [self.get_area_data()]

        # Next, iterate through each (filterable) data set in the db
        for data_set in tqdm(
            DataSet.objects.filter(is_filterable=True).order_by("-category", "source"),
            disable=self._quiet,
        ):
            # Most datasets only have one datatype, but some (ranges) have multiple, and need to be handled in a slightly different
            # way.
            data_types = DataType.objects.filter(data_set=data_set)
            for data_type in data_types:
                # Get the data itself
                if data_set.table == "areadata":
                    data = AreaData.objects.filter(data_type=data_type)
                else:
                    data = PersonData.objects.filter(data_type=data_type)

                # Get the label for the column for this dataset
                if data_set.is_range:
                    label = f"{data_set.label}: {data_type.label}"
                else:
                    label = data_set.label
                if data_set.is_percentage:
                    label += " (%)"

                new_df = self.create_dataset_df(data, label, data_set.table)
                dfs_list.append(new_df)

        df = pd.concat(dfs_list, axis=1)
        return df
