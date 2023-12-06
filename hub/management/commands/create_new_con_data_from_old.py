from django.core.management.base import BaseCommand

import pandas as pd
from mysoc_dataset import get_dataset_df

from hub.models import Area, AreaData, AreaType, DataSet, DataType
from utils.constituency_mapping import convert_data_geographies


class Command(BaseCommand):
    help = "Create new constituency data from old constituency data"

    new_con_at = AreaType.objects.get(code="WMC23")
    old_con_at = AreaType.objects.get(code="WMC")

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def fetch_parl25_gss_map(self):
        df = get_dataset_df(
            repo_name="2025-constituencies",
            package_name="parliament_con_2025",
            version_name="latest",
            file_name="parl_constituencies_2025.csv",
        )
        self.parl25_gss_map = df.set_index("short_code").gss_code.to_dict()

    def apply_parl25_gss_to_df(self, df):
        df["PARL25"] = df["PARL25"].apply(
            lambda name: self.parl25_gss_map.get(name, None)
        )
        return df

    def get_df_from_datatype(self, dt):
        if dt.data_set.table == "areadata":
            data = AreaData.objects.filter(
                data_type=dt, area__area_type=self.old_con_at
            )

        data_list = []
        for d in data:
            data_list.append([d.area.gss, d.value()])

        df = pd.DataFrame(data_list)
        df.columns = ["PARL10", "value"]

        return df

    def create_data_for_new_con(self, old_dt, df):
        try:
            dt = DataType.objects.get(
                data_set=old_dt.data_set, area_type=self.new_con_at
            )
        except DataType.DoesNotExist:
            dt = old_dt
            dt.pk = None
            dt._state.adding = True
            dt.area_type = self.new_con_at
            dt.save()

        value_col = dt.value_col
        for _, row in df.iterrows():
            a = Area.objects.get(gss=row["PARL25"], area_type=self.new_con_at)
            AreaData.objects.update_or_create(
                area=a,
                data_type=dt,
                defaults={
                    value_col: row["value"],
                },
            )
        dt.data_set.areas_available.add(self.new_con_at)

    def convert_datatype_to_new_geography(self, dt):
        df = self.get_df_from_datatype(dt)
        input_values_type = "percentage"
        if dt.data_set.unit_type != "percentage":
            input_values_type = "absolute"

        new_df = convert_data_geographies(
            df=df,
            input_geography="PARL10",
            output_geography="PARL25",
            input_values_type=input_values_type,
        )
        new_df = self.apply_parl25_gss_to_df(new_df)
        self.create_data_for_new_con(dt, new_df)

    def process_datasets(self):
        sets = DataSet.objects.filter(
            unit_distribution__in=["people_in_area", "point"],
            category__in=["place", "opinion", "movement"],
        )

        for ds in sets:
            print(ds.label, ds.unit_type)
            for dt in DataType.objects.filter(data_set=ds, area_type=self.old_con_at):
                self.convert_datatype_to_new_geography(dt)

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.fetch_parl25_gss_map()
        self.process_datasets()
