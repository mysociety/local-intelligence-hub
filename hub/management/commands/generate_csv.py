from functools import reduce

from django.conf import settings
from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import AreaData, DataSet, DataType, PersonData


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
        for data_set in tqdm(DataSet.objects.all(), disable=self._quiet):
            if data_set.is_filterable:
                data_type = DataType.objects.filter(data_set=data_set).first()
                if data_set.table == "areadata":
                    data = AreaData.objects.filter(data_type=data_type)
                else:
                    data = PersonData.objects.filter(data_type=data_type)
                # Build a df
                new_df_data = []
                for datum in data:
                    if data_set.table == "areadata":
                        area = datum.area
                    else:
                        area = datum.person.area
                    new_df_data.append([area.gss, datum.value()])
                dfs_list.append(pd.DataFrame(new_df_data, columns=["gss_code", data_set.label]).set_index('gss_code'))
        df = reduce(lambda left, right:     # Merge DataFrames in list
                     left.join(right,
                              how = "outer"),
                     dfs_list)
        df.to_csv(self.out_file, index=False) 
