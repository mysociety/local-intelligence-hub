from django.core.management.base import BaseCommand

import pandas as pd
import requests
from tqdm import tqdm

from hub.models import DataSet, DataType, Person, PersonData

COMMITTEE_REQUEST_URL = "https://committees-api.parliament.uk/api/Committees"


class Command(BaseCommand):
    help = "Import select committee memberships for UK Members of Parliament"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.import_results()

    def get_results(self):
        if not self._quiet:
            self.stdout.write("Fetching all current Select Committee memberships")

        mps = Person.objects.filter(person_type="MP")
        mp_ids = list(mps.values_list("external_id", flat=True))

        select_committees_json = []
        for mp in tqdm(mp_ids, disable=self._quiet):
            response = requests.get(
                f"https://committees-api.parliament.uk/api/Members?Members={str(mp)}&MembershipStatus=Current&CommitteeCategory=Select"
            )
            if response.status_code == 200:
                response_json = response.json()
                if response_json != []:
                    select_committees_json.extend(response_json)
            else:
                self.stdout.write(f"Request failed for MP with ID: {str(mp)}")

        df = pd.DataFrame.from_records(select_committees_json)[["committees", "id"]]
        df = df.explode("committees")
        df["committee_name"] = df.committees.str["name"]
        df["mp"] = df.id.apply(lambda mp_id: mps.get(external_id=mp_id))
        return df

    def create_data_types(self):
        if not self._quiet:
            self.stdout.write("Creating data set and type")
        select_committee_membership_ds, created = DataSet.objects.update_or_create(
            name="select_committee_membership",
            defaults={
                "data_type": "text",
                "description": "MP membership in Select Committees",
                "label": "Select Committee membership",
                "source_label": "UK Parliament",
                "source": "https://parliament.uk/",
                "table": "person__persondata",
                "comparators": DataSet.in_comparators(),
            },
        )
        select_committee_membership, created = DataType.objects.update_or_create(
            data_set=select_committee_membership_ds,
            name="select_committee_membership",
            defaults={"data_type": "text"},
        )

        return select_committee_membership

    def add_results(self, results, data_type):
        if not self._quiet:
            self.stdout.write("Adding Select Committee Membership")
        for index, result in tqdm(results.iterrows(), disable=self._quiet):
            committee_membership, created = PersonData.objects.update_or_create(
                person=result.mp,
                data_type=data_type,
                defaults={"data": result.committee_name},
            )

    def import_results(self):
        data_type = self.create_data_types()
        results = self.get_results()
        self.add_results(results, data_type)
