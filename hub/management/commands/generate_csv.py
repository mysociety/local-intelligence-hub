from functools import reduce

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
        dfs_list = []

        area_details = []
        for area in Area.objects.filter(area_type="WMC"):
            try:
                mp = Person.objects.get(area=area)
            except Person.DoesNotExist:
                print(f"Person does not exist for area {area.gss} {area.name}")
            area_details.append([area.gss, area.name, area.mapit_id, mp.name])
        dfs_list.append(
            pd.DataFrame(
                area_details,
                columns=["Area GSS code", "Area name", "Area MapIt ID", "MP name"],
            ).set_index("Area GSS code")
        )

        for data_set in tqdm(
            DataSet.objects.filter(is_filterable=True).order_by("-category", "source"),
            disable=self._quiet,
        ):
            data_types = DataType.objects.filter(data_set=data_set)
            for data_type in data_types:
                if data_set.table == "areadata":
                    data = AreaData.objects.filter(data_type=data_type)
                else:
                    data = PersonData.objects.filter(data_type=data_type)
                if data_set.is_range:
                    label = f"{data_set.label}: {data_type.label}"
                else:
                    label = data_set.label
                if data_set.is_percentage:
                    label += " (%)"
                new_df_data = []
                for datum in data:
                    if data_set.table == "areadata":
                        area = datum.area
                    else:
                        area = datum.person.area
                    new_df_data.append([area.gss, datum.value()])
                new_df = pd.DataFrame(
                        new_df_data, columns=["Area GSS code", label]
                    )
                new_df = new_df.groupby('Area GSS code').agg({"Area GSS code": "first", label: lambda l: ", ".join([str(x) for x in l])})
                new_df = new_df.set_index("Area GSS code")
                dfs_list.append(new_df)

        df = pd.concat(dfs_list, axis=1)
        df.to_csv(self.out_file)
