import pandas as pd
from mysoc_dataset import get_dataset_df
from tqdm import tqdm

from hub.models import Area, AreaData, AreaType, DataType
from utils.constituency_mapping import convert_data_geographies


class DataTypeConverter:
    def fetch_parl25_gss_map(self):
        df = get_dataset_df(
            repo_name="2025-constituencies",
            package_name="parliament_con_2024",
            version_name="latest",
            file_name="parl_constituencies_2024.csv",
            done_survey=True,
        )
        return df.set_index("short_code").gss_code.to_dict()

    def __init__(self):
        self.new_con_at = AreaType.objects.get(code="WMC23")
        self.old_con_at = AreaType.objects.get(code="WMC")
        self.parl25_gss_map = self.fetch_parl25_gss_map()

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

    def delete_old_data(self, dt):
        AreaData.objects.filter(data_type=dt).delete()

    def create_data_for_new_con(self, old_dt, df):
        try:
            dt = DataType.objects.get(
                name=old_dt.name, data_set=old_dt.data_set, area_type=self.new_con_at
            )
        except DataType.DoesNotExist:
            dt = old_dt
            dt.pk = None
            dt._state.adding = True
            dt.area_type = self.new_con_at
            dt.save()

        dt.auto_converted = True
        dt.save()

        if self.delete_old:
            self.delete_old_data(dt)

        value_col = dt.value_col
        for _, row in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            a = Area.objects.get(gss=row["PARL25"], area_type=self.new_con_at)
            AreaData.objects.update_or_create(
                area=a,
                data_type=dt,
                defaults={
                    value_col: row["value"],
                },
            )
        dt.data_set.areas_available.add(self.new_con_at)
        dt.update_average()
        dt.update_max_min()

    def convert_datatype_to_new_geography(self, dt, delete_old=False, quiet=True):
        self.delete_old = delete_old
        self._quiet = quiet

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

    @property
    def old_area_type(self):
        return self.old_con_at
