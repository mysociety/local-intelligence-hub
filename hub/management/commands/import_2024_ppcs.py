from collections import Counter

from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area, DataSet, DataType, Person, PersonData

party_shades = {
    "Alba Party": "#005EB8",
    "Alliance Party of Northern Ireland": "#F6CB2F",
    "Conservative Party": "#0087DC",
    "Democratic Unionist Party": "#D46A4C",
    "Green Party": "#6AB023",
    "Labour Co-operative": "#E4003B",
    "Labour Party": "#E4003B",
    "Liberal Democrats": "#FAA61A",
    "Plaid Cymru": "#005B54",
    "Scottish National Party": "#FDF38E",
    "Sinn Féin": "#326760",
    "Social Democratic and Labour Party": "#2AA82C",
    "Speaker of the House of Commons": "#DCDCDC",
    "independent politician": "#DCDCDC",
}


class Command(BaseCommand):
    help = "Import Parliamentary Prospective Candidates for 2024 election"

    area_type = "WMC23"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet: bool = False, *args, **options):
        self._quiet = quiet
        self.import_ppcs()

    def get_ppc_data(self):
        csv = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRhZbBrU2AdJDYyBZViMs6irvH7zVUiZm2rDoADw5B18drp6hILJBr-duSXCmHJ18SmYWm3iq0bbfoR/pub?gid=0&single=true&output=csv"
        df = pd.read_csv(csv)
        df = df.dropna(subset=["Candidate Name"])

        return df

    def import_ppcs(self):
        df = self.get_ppc_data()

        party_dt = DataType.objects.get(name="party")

        if not self._quiet:
            print("Importing PPCs")

        for _, ppc in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            area = Area.get_by_name(ppc["Constituency"], area_type=self.area_type)
            if area is None:  # pragma: no cover
                print(
                    f"Failed to add PPC {ppc['Candidate Name']} as area {ppc['Constituency']} does not exist"
                )
                continue

            if area and "DC Candidate ID" in ppc:
                person, created = Person.objects.update_or_create(
                    person_type="PPC",
                    external_id=ppc["DC Candidate ID"],
                    id_type="dc_candidate_id",
                    defaults={
                        "name": ppc["Candidate Name"],
                        "area": area,
                    },
                )

            if person:
                if not pd.isna(ppc["Party"]):
                    try:
                        PersonData.objects.get_or_create(
                            person=person,
                            data_type=party_dt,
                            defaults={"data": ppc["Party"]},
                        )
                    except PersonData.MultipleObjectsReturned:  # pragma: no cover
                        PersonData.objects.filter(
                            person=person, person_type="PPC", data_type=party_dt
                        ).delete()
                        PersonData.objects.create(
                            person=person, data_type=party_dt, data=ppc["Party"]
                        )

        dataset = DataSet.objects.filter(name="party", options=list())
        if dataset:
            parties = list()
            all_parties = list(
                PersonData.objects.filter(
                    data_type__data_set__name="party"
                ).values_list("data")
            )

            for party, count in Counter(all_parties).most_common():
                shade = party_shades.get(party[0], "#DCDCDC")
                parties.append(dict(title=party[0], shader=shade))

            dataset.update(options=parties)
