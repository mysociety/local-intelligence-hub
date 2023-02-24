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
            # TODO: This .first() means we only get the `ages_0-9` dataset in `constituency_age_distribution`
            data_type = DataType.objects.filter(data_set=data_set).first()

            # TODO: Do something special to handle age bands correctly (see .first() issue, above)
            if data_set.name == "constituency_age_distribution":
                continue

            # TODO: Do something special to handle APPGs and SCs properly (see join duplication issue, below)
            if data_set.name in ["mp_appg_memberships", "select_committee_membership"]:
                continue

            if data_set.table == "areadata":
                data = AreaData.objects.filter(data_type=data_type)
            else:
                data = PersonData.objects.filter(data_type=data_type)

            new_df_data = []
            for datum in data:
                if data_set.table == "areadata":
                    area = datum.area
                else:
                    area = datum.person.area
                new_df_data.append([area.gss, datum.value()])
            dfs_list.append(
                pd.DataFrame(
                    new_df_data, columns=["Area GSS code", data_set.label]
                ).set_index("Area GSS code")
            )

        # TODO: This results in multiple rows output for constituencies where the MP is in more than one APPG or Select Committee (probably other data_types too, but those are the most obvious ones causing duplication)
        df = reduce(
            lambda left, right: left.join(  # Merge DataFrames in list
                right, how="outer"
            ),
            dfs_list,
        )

        df.to_csv(self.out_file)
