from datetime import date

from django.core.management.base import BaseCommand

import requests
from dateutil.parser import isoparse
from tqdm import tqdm

from hub.models import DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import election results for UK Members of Parliament"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet=False, *args, **options):
        self._quiet = quiet
        self.import_results()

    def get_results(self):
        mps = PersonData.objects.filter(
            data_type__name="parlid", person__person_type="MP"
        ).select_related("person")

        results = {}
        if not self._quiet:
            self.stdout.write("Fetching MP election results")
        for mp_id in tqdm(mps.all(), disable=self._quiet):
            if mp_id.value() == "":  # pragma: no cover
                print(f"problem with {mp_id.person.name} - no id")
                continue

            if mp_id.person.end_date:
                continue

            response = requests.get(
                f"https://members-api.parliament.uk/api/Members/{mp_id.value()}"
            )
            try:
                data = response.json()
                membership = data["value"]["latestHouseMembership"]
                if membership.get("membershipEndDate", None) is not None:
                    end_date = isoparse(membership["membershipEndDate"])
                    mp_id.person.end_date = end_date.date().isoformat()
                    mp_id.person.save()
                    continue

                results[mp_id.person.id] = {
                    "first_elected": membership["membershipStartDate"]
                }
            except requests.RequestException:  # pragma: no cover
                print(
                    f"problem fetching info for {mp_id.person.name} with id {mp_id.value()}"
                )
            except KeyError:  # pragma: no cover
                print(f"no results for {mp_id.person.name} with {mp_id.value()}")

            response = requests.get(
                f"https://members-api.parliament.uk/api/Members/{mp_id.value()}/LatestElectionResult"
            )
            try:
                data = response.json()
                results[mp_id.person.id]["majority"] = data["value"]["majority"]
                results[mp_id.person.id]["last_elected"] = data["value"]["electionDate"]
            except requests.RequestException:  # pragma: no cover
                print(
                    f"problem fetching election result for {mp_id.person.name} with id {mp_id.value()}"
                )

        return results

    def create_data_types(self):
        if not self._quiet:
            self.stdout.write("Creating data sets and types")
        majority_ds, created = DataSet.objects.update_or_create(
            name="mp_election_majority",
            defaults={
                "data_type": "integer",
                "label": "MP majority",
                "description": "Majority at last election.",
                "release_date": str(date.today()),
                "source": "https://members-api.parliament.uk/",
                "source_label": "Data from UK Parliament.",
                "comparators": DataSet.numerical_comparators()[::-1],
                "table": "person__persondata",
                "default_value": 1000,
            },
        )
        majority, created = DataType.objects.update_or_create(
            data_set=majority_ds,
            name="mp_election_majority",
            defaults={"label": "MP majority", "data_type": "integer"},
        )

        last_elected_ds, created = DataSet.objects.update_or_create(
            name="mp_last_elected",
            defaults={
                "data_type": "date",
                "label": "Date MP last elected",
                "description": "Date of last election for an MP",
                "source": "https://members-api.parliament.uk/",
                "release_date": str(date.today()),
                "source_label": "Data from UK Parliament.",
                "table": "person__persondata",
                "comparators": DataSet.year_comparators(),
                "default_value": 2019,
            },
        )
        last_elected, created = DataType.objects.update_or_create(
            data_set=last_elected_ds,
            name="mp_last_elected",
            defaults={"label": "Date MP last elected", "data_type": "date"},
        )

        first_elected_ds, created = DataSet.objects.update_or_create(
            name="mp_first_elected",
            defaults={
                "data_type": "date",
                "label": "Date MP first elected",
                "description": "Date an MP was first elected to current position.",
                "release_date": str(date.today()),
                "source": "https://members-api.parliament.uk/",
                "source_label": "Data from UK Parliament.",
                "table": "person__persondata",
                "comparators": DataSet.year_comparators(),
                "default_value": 2019,
            },
        )
        first_elected, created = DataType.objects.update_or_create(
            data_set=first_elected_ds,
            name="mp_first_elected",
            defaults={"label": "Date MP first elected", "data_type": "date"},
        )

        return {
            "majority": majority,
            "first_elected": first_elected,
            "last_elected": last_elected,
        }

    def add_results(self, results, data_types):
        if not self._quiet:
            self.stdout.write("Updating MP election results")
        for mp_id, result in tqdm(results.items(), disable=self._quiet):
            person = Person.objects.get(id=mp_id)

            for key, data_type in data_types.items():
                data, created = PersonData.objects.update_or_create(
                    person=person,
                    data_type=data_type,
                    defaults={"data": result[key]},
                )

    def import_results(self):
        data_types = self.create_data_types()
        results = self.get_results()
        self.add_results(results, data_types)
