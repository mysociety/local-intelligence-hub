from datetime import date

import requests
from tqdm import tqdm

from hub.models import AreaType, DataSet, DataType, Person, PersonData

from .base_importers import BaseImportCommand


class Command(BaseImportCommand):
    help = "Import contact details for UK Members of Parliament"

    area_type = "WMC23"

    def add_arguments(self, parser):
        super(Command, self).add_arguments(parser)
        parser.add_argument(
            "--area_type", action="store", help="Set area type code, default is WMC23"
        )

    def handle(self, *args, **options):
        super(Command, self).handle(*args, **options)

        if options.get("area_type") is not None:
            self.area_type = options["area_type"]

        self.import_results()

    def get_results(self):
        mps = PersonData.objects.filter(
            data_type__name="parlid", person__person_type="MP"
        ).select_related("person")

        results = {}
        if not self._quiet:
            self.stdout.write("Fetching MP contact details")
        for mp_id in tqdm(mps.all(), disable=self._quiet):
            if mp_id.value() == "":  # pragma: no cover
                print(f"problem with {mp_id.person.name} - no id")
                continue

            response = requests.get(
                f"https://members-api.parliament.uk/api/Members/{mp_id.value()}/Contact"
            )
            try:
                data = response.json()
                office_details = next(
                    (
                        d
                        for d in data["value"]
                        if d.get("type") == "Parliamentary office"
                    ),
                    None,
                )
                if office_details is not None:
                    results[mp_id.person.id] = {
                        "email": office_details.get("email", None),
                        "phone": office_details.get("phone", None),
                    }
            except requests.RequestException:  # pragma: no cover
                print(
                    f"problem fetching info for {mp_id.person.name} with id {mp_id.value()}"
                )
            except KeyError:  # pragma: no cover
                print(f"no results for {mp_id.person.name} with {mp_id.value()}")

        return results

    def create_data_types(self):
        if not self._quiet:
            self.stdout.write("Creating data sets and types")
        area_type = AreaType.objects.get(code=self.area_type)
        email_ds, created = DataSet.objects.update_or_create(
            name="mp_email",
            defaults={
                "data_type": "text",
                "label": "MP’s office email address",
                "description": "",
                "release_date": str(date.today()),
                "source": "https://members-api.parliament.uk/",
                "source_label": "Data from UK Parliament.",
                "comparators": DataSet.string_comparators(),
                "table": "people__persondata",
                "default_value": "",
                "is_public": False,  # the default anyway
            },
        )
        email_ds.areas_available.add(area_type)
        self.add_object_to_site(email_ds)
        email_dt, created = DataType.objects.update_or_create(
            data_set=email_ds,
            name="mp_email",
            area_type=area_type,
            defaults={"label": "MP’s office email address", "data_type": "text"},
        )

        phone_ds, created = DataSet.objects.update_or_create(
            name="mp_phone",
            defaults={
                "data_type": "text",
                "label": "MP’s office phone number",
                "description": "",
                "source": "https://members-api.parliament.uk/",
                "release_date": str(date.today()),
                "source_label": "Data from UK Parliament.",
                "table": "people__persondata",
                "comparators": DataSet.string_comparators(),
                "default_value": "",
                "is_public": False,  # the default anyway
            },
        )
        phone_ds.areas_available.add(area_type)
        self.add_object_to_site(phone_ds)
        phone_dt, created = DataType.objects.update_or_create(
            data_set=phone_ds,
            name="mp_phone",
            area_type=area_type,
            defaults={"label": "MP’s office phone number", "data_type": "text"},
        )

        return {
            "email": email_dt,
            "phone": phone_dt,
        }

    def add_results(self, results, data_types):
        if not self._quiet:
            self.stdout.write("Updating MP contact details")
        for mp_id, result in tqdm(results.items(), disable=self._quiet):
            person = Person.objects.get(id=mp_id)

            for key, data_type in data_types.items():
                if result.get(key) is not None:
                    data, created = PersonData.objects.update_or_create(
                        person=person,
                        data_type=data_type,
                        defaults={"data": result[key]},
                    )

    def import_results(self):
        data_types = self.create_data_types()
        results = self.get_results()
        self.add_results(results, data_types)
