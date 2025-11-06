import json

from django.conf import settings

import pandas as pd

from hub.models import AreaData, DataSet

from .base_importers import BaseImportFromDataFrameCommand, party_shades

YELLOW = "\033[33m"
RED = "\033[31m"
GREEN = "\033[32m"
NOBOLD = "\033[0m"


class Command(BaseImportFromDataFrameCommand):
    help = "Import based on config"

    json_config_file = settings.BASE_DIR / "conf" / "imports.json"

    defaults_cols = [
        "label",
        "data_type",
        "category",
        "subcategory",
        "release_date",
        "source_label",
        "source",
        "source_type",
        "data_url",
        "table",
        "default_value",
        "exclude_countries",
        "unit_type",
        "unit_distribution",
        "fill_blanks",
        "is_public",
        "is_filterable",
    ]

    def add_arguments(self, parser):
        super().add_arguments(parser)

        parser.add_argument(
            "--import_name", action="store", help="Name of import to run"
        )

        parser.add_argument(
            "--list_imports",
            action="store_true",
            help="List available imports and status",
        )

    def get_configs(self, import_name):
        confs = []

        with open(self.json_config_file) as config:
            c = json.load(config)
            for conf in c:
                if conf["name"] == import_name:
                    if conf.get("data_types"):
                        conf["data_set_name"] = conf["name"]
                        conf["data_set_label"] = conf["label"]
                        for dt in conf["data_types"]:
                            dt_conf = {**conf, **dt}
                            del dt_conf["data_types"]
                            confs.append(dt_conf)
                    else:
                        confs.append(conf)

        return confs

    def list_all_imports(self):
        configs = []
        with open(self.json_config_file) as config:
            c = json.load(config)
            for conf in c:
                data = {
                    "name": conf["name"],
                    "label": conf["label"],
                }

                try:
                    ds = DataSet.objects.get(name=conf["name"])
                    data["state"] = (
                        f"{GREEN}Imported{NOBOLD} {ds.last_update.date().isoformat()}"
                    )
                except DataSet.DoesNotExist:
                    data_file = settings.BASE_DIR / "data" / conf["data_file"]
                    if data_file.exists():
                        data["state"] = f"{YELLOW}Not imported, file available{NOBOLD}"
                    else:
                        data["state"] = f"{RED}Not imported, file missing{NOBOLD}"

                configs.append(data)

        for conf in configs:
            self.stdout.write(f"{conf['name']} ({conf['state']}) - {conf['label']}")

    def setup(self, import_name, row):
        self.message = f"Importing {row['label']}"
        self.cons_row = row["constituency_col"]
        self.cons_col = row["constituency_col"]
        self.data_file = settings.BASE_DIR / "data" / row["data_file"]
        self.file_type = row["file_type"]
        self.area_type = row["area_type"]
        self.header_row = row.get("header_row")
        self.sheet = row.get("sheet")
        self.data_types = {}
        self.replace_columns = row.get("replace_columns")
        self.data_type = row["data_type"]
        self.data_col = row["data_col"]
        self.party_data = row.get("party_data")
        self.gss_map = row.get("gss_map")
        self.fill_blanks = row.get("fill_blanks", False)
        self.url_prefix = row.get("url_prefix", False)
        self.url_label = row.get("url_label", False)
        self.skip_countries = row.get("skip_countries", [])

        if row["uses_gss"]:
            self.uses_gss = True
        else:
            self.uses_gss = False

        try:
            self.cons_col = int(self.cons_col)
            self.cons_row = int(self.cons_row)
        except ValueError:
            pass

        if row.get("do_not_delete"):
            self.skip_delete = True
        else:
            self.skip_delete = False

        if row.get("multiply_percentage"):
            self.multiply_percentage = True
        else:
            self.multiply_percentage = False

        if row.get("delete_first"):
            self.delete_first = True
        else:
            self.delete_first = False

        defaults = {}

        comparators = row.get("comparators", None)
        if comparators:
            name = f"{comparators}_comparators"
            if hasattr(DataSet, name):
                c = getattr(DataSet, name)
                comparators = c()
            else:
                comparators = DataSet.comparators_default()
        else:
            comparators = DataSet.comparators_default()

        defaults["comparators"] = comparators

        for col in self.defaults_cols:
            val = row[col]
            if val is None:
                val = ""
            defaults[col] = val

        if defaults["exclude_countries"] is None:
            defaults["exclude_countries"] = []

        # don't use blank descriptions
        if row.get("description") and row["description"] != "":
            defaults["description"] = row["description"]

        if row["is_range"]:
            defaults["is_range"] = True
        if row.get("is_time_series"):
            defaults["is_time_series"] = True

        if row["is_range"] or row["is_time_series"]:
            defaults["data_set_name"] = row["data_set_name"]
            defaults["data_set_label"] = row["data_set_label"]
            if row.get("order"):
                defaults["order"] = row["order"]

        if self.party_data:
            defaults["options"] = [
                {"title": party, "shader": shade}
                for party, shade in party_shades.items()
            ]

        self.data_sets = {import_name: {"defaults": defaults, "col": row["data_col"]}}

    def get_dataframe(self):
        if self.file_type == "csv":
            kwargs = {}
            if self.header_row:
                kwargs["header"] = int(self.header_row)
            df = pd.read_csv(self.data_file, **kwargs)
        elif self.file_type == "excel":
            kwargs = {}
            if self.sheet:
                kwargs["sheet_name"] = self.sheet
            if self.header_row:
                kwargs["header"] = int(self.header_row)
            df = pd.read_excel(self.data_file, **kwargs)
        else:
            self.stderr.write(f"Unknown file type: {self.file_type}")
            return None

        if self.replace_columns:
            if len(df.columns) > len(self.replace_columns):
                df = df.iloc[:, 0 : len(self.replace_columns)]
            df.columns = self.replace_columns

        # drop any completely empty rows (eg: "spacer" rows in an Excel sheet)
        df = df.dropna(how="all")

        if not isinstance(self.get_cons_col(), int):
            df = df.astype({self.get_cons_col(): "str"})

        if self.data_type == "percent":
            if self.fill_blanks:
                df[self.data_col] = df[self.data_col].fillna(0)
            if isinstance(df.dtypes[[self.data_col]], (str, object)):
                df[self.data_col] = (
                    df[self.data_col].astype(str).str.strip("%").astype(float)
                )
        elif self.data_type == "integer":
            if self.fill_blanks:
                df[self.data_col] = df[self.data_col].fillna(0)
            else:
                df = df.dropna(subset=[self.data_col])
            df = df.astype({self.data_col: "int"})

        if self.party_data:
            df[self.data_col] = df[self.data_col].map(lambda x: self.party_data[x])

        if self.gss_map:
            df[self.cons_col] = df[self.cons_col].map(lambda x: self.gss_map.get(x, x))
        return df

    def get_row_data(self, row, conf):
        value = super().get_row_data(row, conf)
        if conf["defaults"]["data_type"] == "url":
            label = conf["defaults"]["label"]
            if self.url_prefix:
                value = f"{self.url_prefix}{value}"
            if self.url_label:
                label = self.url_label

            value = {"url": value, "link_text": label}
        if self.multiply_percentage:
            value = value * 100

        return value

    def initial_delete(self, conf):
        AreaData.objects.filter(
            data_type__name=conf["name"], area__area_type__code=self.area_type
        ).delete()

    def handle(
        self,
        skip_new_areatype_conversion=False,
        import_name=None,
        list_imports=False,
        *args,
        **options,
    ):
        if list_imports:
            self.list_all_imports()
        elif import_name is None:
            self.stderr.write("Either import_name or list_imports required")
            return

        initial_delete_done = False
        configs = self.get_configs(import_name)
        for conf in configs:
            self.setup(conf["name"], conf)

            if not initial_delete_done and self.delete_first:
                self.initial_delete(conf)
                initial_delete_done = True

            super().handle(skip_new_areatype_conversion, *args, **options)
