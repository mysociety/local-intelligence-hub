import pandas as pd

from hub.models import DataSet, Person

from .base_importers import BaseImportFromDataFrameCommand


class Command(BaseImportFromDataFrameCommand):
    help = "Import MP and constituent attendance of TCC’s 2025 Mass Lobby in London"

    message = "importing TCC 2025 Mass Lobby attendance"
    cons_row = "constituency_name"
    cons_col = "constituency_name"
    file_url = "https://docs.google.com/spreadsheets/d/1umLKyLyVBVCU023JSKvHO0nSbWZ-jiw6/export?format=csv"
    uses_gss = False

    area_type = "WMC23"

    data_sets = {
        "2025_mass_lobby_mp": {
            "defaults": {
                "label": "MP attendance at 2025 Act Now Change Forever Mass Lobby",
                "data_type": "string",
                "category": "movement",
                "release_date": "July 2025",
                "source_label": "Data collected by The Climate Coalition.",
                "source": "https://www.theclimatecoalition.org/act-now-change-forever",
                "source_type": "csv",
                "data_url": "",
                "table": "people__persondata",
                "is_shadable": True,
                "is_filterable": True,
                "is_public": True,
                "person_type": "MP",
                "comparators": DataSet.in_comparators(),
                "options": [
                    {"title": "MP attended", "shader": "blue-500"},
                    {"title": "MP sent a representative", "shader": "gray-500"},
                    {"title": "MP did not attend", "shader": "gray-300"},
                ],
                "fill_blanks": False,
            },
            "col": "mp_enum",
        },
        "2025_mass_lobby_constituents": {
            "defaults": {
                "label": "Constituents registered for 2025 Act Now Change Forever Mass Lobby",
                "data_type": "integer",
                "category": "movement",
                "release_date": "July 2025",
                "source_label": "Data collected by The Climate Coalition.",
                "source": "https://www.theclimatecoalition.org/act-now-change-forever",
                "source_type": "csv",
                "data_url": "",
                "table": "areadata",
                "is_shadable": True,
                "is_filterable": True,
                "is_public": True,
                "comparators": DataSet.numerical_comparators(),
                "unit_type": "raw",
                "person_type": "MP",
                "unit_distribution": "people_in_area",
                "fill_blanks": True,
            },
            "col": "total_constituents",
        },
    }

    def get_person_from_row(self, row, area):
        try:
            person = Person.objects.get(
                name=row["mp_name"], person_type="MP", personarea__area=area
            )
        except Person.DoesNotExist:
            print(f"No such person: {row['mp_name']} for {area.name}")
            return

        return person

    def get_dataframe(self):
        df = pd.read_csv(self.file_url, header=1)  # Headers on second row
        df.columns = [col.split("\n")[0].strip() for col in df.columns]

        df = df[
            [
                "MP Name",
                "Constituency",
                "Did the MP attend?",
                "Did MP send a representative instead?",
                "Did MP or rep. attend?",
                "Number of constituents registered (final numbers)",
            ]
        ]

        # Rename the columns, for simplicity
        df.columns = [
            "mp_name",
            "constituency_name",
            "mp_attended",
            "aide_attended",
            "mp_or_aide_attended",
            "total_constituents",
        ]

        # Remove empty rows
        df.dropna(subset=["constituency_name"], inplace=True)

        # Fix broken constituency names in source spreadsheet
        df["constituency_name"] = df["constituency_name"].replace(
            {
                "Montgomeryshire and GlyndÅµr": "Montgomeryshire and Glyndŵr",
                "Taunton": "Taunton and Wellington",
                "Ynys Man": "Ynys Môn",
            }
        )

        df["mp_name"] = df["mp_name"].replace(
            {
                "Sian Berry": "Siân Berry",
                "Zoe Franklin": "Zöe Franklin",
                "DÃ¡ire Hughes": "Dáire Hughes",
                "Ã“rfhlaith Begley": "Órfhlaith Begley",
                "Emma Lewell-Buck": "Emma Lewell",  # Changed her name in 2025
            }
        )

        # Fabian Hamilton’s row has his party in the constituency column
        df.loc[
            (df["mp_name"] == "Fabian Hamilton")
            & (df["constituency_name"] == "Labour Party"),
            "constituency_name",
        ] = "Leeds North East"

        # Monmouthshire’s row has an attendance answer in this column
        df.loc[
            (df["constituency_name"] == "Monmouthshire")
            & (df["mp_name"] == "Yes"),
            "mp_name",
        ] = "Catherine Fookes"

        # Replace empty values in the "total_constituents" column with 0
        df["total_constituents"] = df["total_constituents"].fillna(0)

        def summarise(row):
            if row["mp_attended"] == "Yes":
                return "MP attended"
            elif row["aide_attended"] == "Yes":
                return "MP sent a representative"
            else:
                return "MP did not attend"

        # Calculate a tidied up column, that we will import from
        df["mp_enum"] = df.apply(summarise, axis=1)

        return df
