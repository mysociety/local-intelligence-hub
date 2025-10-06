import pandas as pd
from mysoc_dataset import get_dataset_df
from tqdm import tqdm

from hub.models import Area, AreaData, AreaOverlap, AreaType, DataType
from utils.constituency_mapping import convert_data_geographies


class DataTypeConverter:
    def fetch_parl25_gss_map(self):
        df = get_dataset_df(
            repo_name="2025-constituencies",
            package_name="parliament_con_2025",
            version_name="latest",
            file_name="parl_constituencies_2025.csv",
            done_survey=True,
        )
        return df.set_index("short_code").gss_code.to_dict()

    def __init__(self):
        self.new_con_at = AreaType.objects.get(code="WMC23")
        self.old_con_at = AreaType.objects.get(code="WMC")
        self.input_geo = "PARL10"
        self.export_geo = "PARL25"
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
        df.columns = [self.input_geo, "value"]

        return df

    def delete_old_data(self, dt):
        AreaData.objects.filter(data_type=dt).delete()

    def get_area_type(self, gss_code):
        a = Area.objects.get(gss=gss_code, area_type=self.new_con_at)

        return a

    def create_data_for_new_con(self, old_dt, df):
        try:
            dt = DataType.objects.get(
                name=old_dt.name, data_set=old_dt.data_set, area_type=self.new_con_at
            )
        except DataType.DoesNotExist:
            # get a fresh copy otherwise you can end up with reference issues if you
            # are re-using the old_dt again
            dt = DataType.objects.get(pk=old_dt.id)
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
            a = self.get_area_type(row[self.export_geo])
            if a is None:
                continue
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
            input_geography=self.input_geo,
            output_geography=self.export_geo,
            input_values_type=input_values_type,
        )
        new_df = self.apply_parl25_gss_to_df(new_df)
        self.create_data_for_new_con(dt, new_df)

    @property
    def old_area_type(self):
        return self.old_con_at


class WMCToDISDataTypeConverter(DataTypeConverter):
    def fetch_parl25_gss_map(self):
        df = get_dataset_df(
            repo_name="2025-constituencies",
            package_name="parliament_con_2025",
            version_name="latest",
            file_name="parl_constituencies_2025.csv",
            done_survey=True,
        )
        return df.set_index("gss_code").short_code.to_dict()

    def __init__(self):
        self.new_con_at = AreaType.objects.get(code="DIS")
        self.old_con_at = AreaType.objects.get(code="WMC23")
        self.input_geo = "PARL25"
        self.export_geo = "LAD23"
        self.parl25_gss_map = self.fetch_parl25_gss_map()

    def get_area_type(self, gss_code):
        try:
            a = Area.objects.get(gss=gss_code, area_type__code="DIS")
        except Area.DoesNotExist:
            return None

        return a

    def get_df_from_datatype(self, dt):
        df = super().get_df_from_datatype(dt)

        df["PARL25"] = df["PARL25"].apply(
            lambda name: self.parl25_gss_map.get(name, None)
        )
        return df

    def apply_parl25_gss_to_df(self, df):
        return df


class WMCToSTCDataTypeConverter(WMCToDISDataTypeConverter):
    def __init__(self):
        self.new_con_at = AreaType.objects.get(code="STC")
        self.old_con_at = AreaType.objects.get(code="WMC23")
        self.input_geo = "PARL25"
        self.export_geo = "LAD23"
        self.parl25_gss_map = self.fetch_parl25_gss_map()

    def get_area_type(self, gss_code):
        try:
            a = Area.objects.get(gss=gss_code, area_type__code="STC")
        except Area.DoesNotExist:
            return None

        return a


class CouncilToPFADataTypeConverter(DataTypeConverter):
    """Converts data from local authority areas (DIS/STC) to policing areas (PFA)"""

    def __init__(self):
        self.new_con_at = AreaType.objects.get(code="PFA")
        self.old_con_at = None  # We accept both DIS and STC
        self.source_area_types = ["DIS", "STC"]

    def get_df_from_datatype(self, dt):
        """Extract existing data from a DataType as a DataFrame"""
        data_list = []
        for area_data in AreaData.objects.filter(
            data_type=dt, area__area_type__code__in=self.source_area_types
        ):
            data_list.append([area_data.area.gss, area_data.value()])

        df = pd.DataFrame(data_list, columns=["gss", "value"])
        return df

    def get_area_type(self, gss_code):
        """Get PFA area by GSS code"""
        try:
            return Area.objects.get(gss=gss_code, area_type__code="PFA")
        except Area.DoesNotExist:
            return None

    def convert_datatype_to_new_geography(
        self, dt, delete_old=False, quiet=True, method="average"
    ):
        """
        Convert a DataType from local authority level to policing area level.
        Uses AreaOverlap relationships to aggregate data, rather than the CSV
        file that convert_data_geographies() would use.

        Args:
            dt: DataType to convert
            delete_old: Whether to delete existing PFA data for this DataType
            quiet: Suppress progress output
            method: Aggregation method - "average" for weighted average, "sum" for total
        """
        self.delete_old = delete_old
        self._quiet = quiet

        # Get source data
        df = self.get_df_from_datatype(dt)
        if df.empty:
            if not quiet:
                print(f"No data found for {dt.name}")
            return

        # Create or get the PFA version of this DataType
        try:
            new_dt = DataType.objects.get(
                name=dt.name, data_set=dt.data_set, area_type=self.new_con_at
            )
        except DataType.DoesNotExist:
            new_dt = DataType.objects.get(pk=dt.id)
            new_dt.pk = None
            new_dt._state.adding = True
            new_dt.area_type = self.new_con_at
            new_dt.save()

        new_dt.auto_converted = True
        new_dt.save()

        if self.delete_old:
            self.delete_old_data(new_dt)

        # Aggregate data to PFA level using AreaOverlap
        pfa_data = {}
        for _, row in df.iterrows():
            la_gss = row["gss"]
            value = row["value"]

            # Find which PFA(s) this LA belongs to
            overlaps = AreaOverlap.objects.filter(
                area_from__gss=la_gss, area_to__area_type=self.new_con_at
            )

            for overlap in overlaps:
                pfa_area = overlap.area_to

                if pfa_area.gss not in pfa_data:
                    pfa_data[pfa_area.gss] = {
                        "area": pfa_area,
                        "sum": 0,
                        "weighted_sum": 0,
                        "weight_total": 0,
                    }

                if method == "sum":
                    # For raw counts, just sum them up
                    pfa_data[pfa_area.gss]["sum"] += value
                else:
                    # For percentages/averages, do weighted average
                    weight = overlap.population_overlap / 100.0
                    pfa_data[pfa_area.gss]["weighted_sum"] += value * weight
                    pfa_data[pfa_area.gss]["weight_total"] += weight

        # Save aggregated data
        value_col = new_dt.value_col
        for pfa_gss, data in tqdm(
            pfa_data.items(), disable=self._quiet, total=len(pfa_data)
        ):
            if method == "sum":
                aggregated_value = data["sum"]
            else:
                # Calculate weighted average
                if data["weight_total"] > 0:
                    aggregated_value = data["weighted_sum"] / data["weight_total"]
                else:
                    aggregated_value = data["weighted_sum"]

            AreaData.objects.update_or_create(
                area=data["area"],
                data_type=new_dt,
                defaults={value_col: aggregated_value},
            )

        # Update dataset metadata
        new_dt.data_set.areas_available.add(self.new_con_at)
        new_dt.update_average()
        new_dt.update_max_min()
