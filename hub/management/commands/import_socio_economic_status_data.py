from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, AreaData, DataSet, DataType


class Command(BaseCommand):
    help = "Import data about socio-economic statuses"

    source_url = "https://commonslibrary.parliament.uk/find-the-socio-economic-status-of-people-living-in-england-and-wales-by-constituency/"
    data_url = "https://data.parliament.uk/resources/constituencystatistics/PowerBIData/Census%202021/NS-SEC_2021.xlsx"

    area_type = "WMC"

    message = "Importing constituency socio-economic data"
    defaults = {
        "label": "Socio-Economic Status",
        "description": "Socio-economic status as of the 2021 census",
        "data_type": "percent",
        "category": "place",
        "source_label": "House of Commons Library",
        "is_range": True,
        "source": source_url,
        "source_type": "xlxs",
        "data_url": data_url,
        "table": "areadata",
        "exclude_countries": ["Scotland", "Northern Ireland"],
        "comparators": DataSet.numerical_comparators(),
        "default_value": 10,
        "is_shadable": False,
    }

    machine_readable_names = {
        "Higher managerial, administrative and professional occupations": "higher_professional_administrative_occupations",
        "Lower managerial, administrative and professional occupations": "lower_professional_administrative_occupations",
        "Intermediate occupations": "intermediate_occupations",
        "Small employers and own account workers": "small_employers_self_employed",
        "Lower supervisory and technical occupations": "lower_supervisory_technical_occupations",
        "Semi-routine occupations": "semi_routine_occupations",
        "Routine occupations": "routine_occupations",
        "Never worked / long-term unemployed": "never_worked_long_term_unemployed",
        "Full-time students": "full_time_students",
    }
    machine_readable_backwards = {
        value: key for key, value in machine_readable_names.items()
    }

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        df = self.get_dataframe()
        self.data_types = self.create_data_types(df)
        self.delete_data()
        self.import_data(df)

    def create_data_types(self, df):
        if not self._quiet:
            self.stdout.write("Creating dataset + types")
        data_set, created = DataSet.objects.update_or_create(
            name="consituency_socio_economic_status", defaults=self.defaults
        )
        data_types = []
        for col in tqdm(df.columns, disable=self._quiet):
            if col != "gss":
                data_type, created = DataType.objects.update_or_create(
                    data_set=data_set,
                    name=f"se_{self.machine_readable_names[col]}",
                    defaults={
                        "data_type": "percent",
                        "label": col,
                        "description": f"Percentage of people 16+ who are: f{col}",
                    },
                )
                data_types.append(data_type)
        return data_types

    def import_data(self, df):
        if not self._quiet:
            self.stdout.write("Importing socio-economic data")
        for index, row in tqdm(df.iterrows(), disable=self._quiet):
            area = Area.get_by_gss(row.gss, area_type=self.area_type)
            if area is None:
                self.stdout.write(
                    f"Failed to find area with code {row.gss} and area type {self.area_type}"
                )
                continue
            for data_type in self.data_types:
                AreaData.objects.create(
                    data_type=data_type,
                    area=area,
                    data=row[self.machine_readable_backwards[data_type.name[3:]]],
                )
        for col in df.columns:
            if col != "gss":
                average = df[col].mean()
                data_type = DataType.objects.get(
                    name=f"se_{self.machine_readable_names[col]}"
                )
                data_type.average = average
                data_type.save()

    def delete_data(self):
        AreaData.objects.filter(data_type__in=self.data_types).delete()

    def get_dataframe(self):
        df = pd.read_excel(
            self.data_url,
            sheet_name="Constituency data",
            usecols=["ONSConstID", "variables", "Con_pc"],
        )
        df.columns = ["gss", "var", "val"]
        df.val = df.val * 100
        df = df.set_index("gss").pivot(columns=["var"], values="val").reset_index()

        return df
