from collections import Counter

from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm
import magic
from django.core.files import File
import urllib.request

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
        csv = "https://candidates.democracyclub.org.uk/data/export_csv/?election_date=&ballot_paper_id=&election_id=parl.2024-07-04&party_id=&cancelled=&extra_fields=gss&extra_fields=image&extra_fields=email&format=csv"
        df = pd.read_csv(csv)
        # make sure this is an int as sometimes it thinks it's a float and you
        # end up with duplicates
        df["person_id"] = df["person_id"].astype(int)

        return df

    def import_ppcs(self):
        df = self.get_ppc_data()

        party_dt = DataType.objects.get(name="party")

        ds, created = DataSet.objects.get_or_create(
            name="email"
        )
        email_dt, created = DataType.objects.get_or_create(data_set=ds, name="email")

        if not self._quiet:
            print("Importing PPCs")

        for _, ppc in tqdm(df.iterrows(), disable=self._quiet, total=df.shape[0]):
            area = Area.get_by_gss(ppc["gss"], area_type=self.area_type)
            if area is None:  # pragma: no cover
                area = Area.get_by_name(ppc["post_label"], area_type=self.area_type)
                if area is None:  # pragma: no cover
                    print(
                        f"Failed to add PPC {ppc['person_name']} as area {ppc['gss']}/{ppc['post_label']} does not exist"
                    )
                    continue

            if area and "person_id" in ppc:
                person, created = Person.objects.update_or_create(
                    person_type="PPC",
                    external_id=ppc["person_id"],
                    id_type="dc_candidate_id",
                    defaults={
                        "name": ppc["person_name"],
                        "area": area,
                    },
                )
                if not person.photo:
                    self.import_ppc_image(person, ppc["image"])

            if person:
                if not pd.isna(ppc["party_name"]):
                    try:
                        PersonData.objects.get_or_create(
                            person=person,
                            data_type=party_dt,
                            defaults={"data": ppc["party_name"]},
                        )
                    except PersonData.MultipleObjectsReturned:  # pragma: no cover
                        PersonData.objects.filter(
                            person=person, person__person_type="PPC", data_type=party_dt
                        ).delete()
                        PersonData.objects.create(
                            person=person, data_type=party_dt, data=ppc["party_name"]
                        )
                if not pd.isna(ppc["email"]):
                    try:
                        PersonData.objects.get_or_create(
                            person=person,
                            data_type=email_dt,
                            defaults={"data": ppc["email"]},
                        )
                    except PersonData.MultipleObjectsReturned:  # pragma: no cover
                        PersonData.objects.filter(
                            person=person, person__person_type="PPC", data_type=email_dt
                        ).delete()
                        PersonData.objects.create(
                            person=person, data_type=email_dt, data=ppc["email"]
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

    def import_ppc_image(self, ppc, image_url: str):
        try:
            print(f"Getting image for {ppc} from {image_url}")
            file, headers = urllib.request.urlretrieve(image_url)
            if not file:
                return
            mime_type = magic.from_file(file, mime=True)
            extension = mime_type.split("/")[1]
            image = File(open(file, "rb"))
            ppc.photo.save(f"ppc_dc_{ppc.external_id}.{extension}", image)
            ppc.save()
        except Exception as e:
            print(f"Error getting image for {ppc} from {image_url}: {e}")

