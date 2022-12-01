from django.core.management.base import BaseCommand

import requests

from hub.models import DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import UK Members of Parliament"

    def handle(self, *args, **options):
        self.import_results()

    def get_results(self):
        mps = Person.objects.filter(person_type="MP")

        results = {}
        for mp in mps.all():
            if mp.external_id == "":  # pragma: no cover
                print(f"problem with {mp.name} - no id")
                continue

            response = requests.get(
                f"https://members-api.parliament.uk/api/Members/{mp.external_id}/LatestElectionResult"
            )
            try:
                data = response.json()
                results[mp.id] = {
                    "majority": data["value"]["majority"],
                    "last_elected": data["value"]["electionDate"],
                }
            except requests.RequestException:  # pragma: no cover
                print(
                    f"problem fetching election result for {mp.name} with id {mp.external_id}"
                )

            response = requests.get(
                f"https://members-api.parliament.uk/api/Members/{mp.external_id}"
            )
            try:
                data = response.json()
                results[mp.id]["first_elected"] = data["value"][
                    "latestHouseMembership"
                ]["membershipStartDate"]
            except requests.RequestException:  # pragma: no cover
                print(f"problem fetching info for {mp.name} with id {mp.external_id}")
            except KeyError:  # pragma: no cover
                print(f"no results for {mp.name} with {mp.external_id}")

        return results

    def numerical_comparators(self):
        return [
            dict(field_lookup="lt", title="is less than"),
            dict(field_lookup="gte", title="is equal or greater than"),
        ]

    def year_comparators(self):
        return [
            dict(field_lookup="year__lt", title="before year"),
            dict(field_lookup="year__gte", title="since year"),
        ]

    def create_data_types(self):
        majority_ds, created = DataSet.objects.update_or_create(
            name="mp_election_majority",
            defaults={
                "data_type": "integer",
                "description": "Majority at last election",
                "source": "https://members-api.parliament.uk/",
                "comparators": self.numerical_comparators(),
                "default_value": 1000,
            },
        )
        majority, created = DataType.objects.update_or_create(
            data_set=majority_ds,
            name="mp_election_majority",
            defaults={"data_type": "integer"},
        )

        last_elected_ds, created = DataSet.objects.update_or_create(
            name="mp_last_elected",
            defaults={
                "data_type": "date",
                "description": "Date of last election for an MP",
                "source": "https://members-api.parliament.uk/",
                "table": "person__persondata",
                "comparators": self.year_comparators(),
                "default_value": 2019,
            },
        )
        last_elected, created = DataType.objects.update_or_create(
            data_set=last_elected_ds,
            name="mp_last_elected",
            defaults={"data_type": "date"},
        )

        first_elected_ds, created = DataSet.objects.update_or_create(
            name="mp_first_elected",
            defaults={
                "data_type": "date",
                "description": "Date an MP was first elected to current position",
                "source": "https://members-api.parliament.uk/",
                "table": "person__persondata",
                "comparators": self.year_comparators(),
                "default_value": 2019,
            },
        )
        first_elected, created = DataType.objects.update_or_create(
            data_set=first_elected_ds,
            name="mp_first_elected",
            defaults={"data_type": "date"},
        )

        return {
            "majority": majority,
            "first_elected": first_elected,
            "last_elected": last_elected,
        }

    def add_results(self, results, data_types):
        for mp_id, result in results.items():
            person = Person.objects.get(id=mp_id)

            for key, data_type in data_types.items():
                data, created = PersonData.objects.update_or_create(
                    person=person,
                    data_type=data_type,
                    defaults={"data": result[key]},
                )

    def import_results(self):
        results = self.get_results()
        data_types = self.create_data_types()
        self.add_results(results, data_types)
