import urllib.request
from collections import Counter

from django.conf import settings
from django.core.files import File
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db.models import Count

import magic
import requests
from tqdm import tqdm

from hub.models import Area, DataSet, DataType, Person, PersonData

party_shades = {
    "Alba Party": "#005EB8",
    "Alliance Party of Northern Ireland": "#F6CB2F",
    "Conservative Party": "#0087DC",
    "Democratic Unionist Party": "#D46A4C",
    "Green Party of England and Wales": "#6AB023",
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

MP_IMPORT_COMMANDS = [
    "import_mps_relevant_votes",
    "import_mps_select_committee_membership",
    "import_mps_appg_data",
    "import_mp_job_titles",
    "import_mp_engagement",
]


class Command(BaseCommand):
    help = "Import UK Members of Parliament"

    area_type = "WMC"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet: bool = False, *args, **options):
        self._quiet = quiet
        self.import_mps()
        self.check_for_duplicate_mps()
        self.import_mp_images()

    def get_mp_data(self):
        headers = {
            "Accept": "application/json",
            "User-Agent": "Local Intelligence Hub beta",
        }
        """ SPARQL QUERY
        SELECT DISTINCT ?person ?personLabel ?partyLabel ?seatLabel ?gss_code ?twfyid ?parlid ?twitter ?facebook ?wikipedia WHERE
        {
          ?person wdt:P31 wd:Q5 . ?person p:P39 ?ps .
          ?ps ps:P39 ?term . ?term wdt:P279 wd:Q16707842 .
          ?ps pq:P580 ?start . ?ps pq:P4100 ?party . ?ps pq:P768 ?seat .
          FILTER NOT EXISTS { ?ps pq:P582 ?end } .
          ?seat wdt:P836 ?gss_code .
          OPTIONAL { ?person wdt:P2171 ?twfyid } .
          OPTIONAL { ?person wdt:P10428 ?parlid } .
          OPTIONAL { ?person wdt:P2002 ?twitter } .
          OPTIONAL { ?person wdt:P2013 ?facebook } .
          OPTIONAL {
              ?wikipedia schema:about ?person .
              ?wikipedia schema:inLanguage "en" .
              ?wikipedia schema:isPartOf <https://en.wikipedia.org/> .
          } .
          SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
        }
        """
        url = "https://query.wikidata.org/sparql?query=%20%20%20%20%20%20%20%20SELECT%20DISTINCT%20%3Fperson%20%3FpersonLabel%20%3FpartyLabel%20%3FseatLabel%20%3Fgss_code%20%3Ftwfyid%20%3Fparlid%20%3Ftwitter%20%3Ffacebook%20%3Fwikipedia%20WHERE%0A%20%20%20%20%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%20%20%3Fperson%20wdt%3AP31%20wd%3AQ5%20.%20%3Fperson%20p%3AP39%20%3Fps%20.%0A%20%20%20%20%20%20%20%20%20%20%3Fps%20ps%3AP39%20%3Fterm%20.%20%3Fterm%20wdt%3AP279%20wd%3AQ16707842%20.%0A%20%20%20%20%20%20%20%20%20%20%3Fps%20pq%3AP580%20%3Fstart%20.%20%3Fps%20pq%3AP4100%20%3Fparty%20.%20%3Fps%20pq%3AP768%20%3Fseat%20.%0A%20%20%20%20%20%20%20%20%20%20FILTER%20NOT%20EXISTS%20%7B%20%3Fps%20pq%3AP582%20%3Fend%20%7D%20.%0A%20%20%20%20%20%20%20%20%20%20%3Fseat%20wdt%3AP836%20%3Fgss_code%20.%0A%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fperson%20wdt%3AP2171%20%3Ftwfyid%20%7D%20.%0A%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fperson%20wdt%3AP10428%20%3Fparlid%20%7D%20.%0A%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fperson%20wdt%3AP2002%20%3Ftwitter%20%7D%20.%0A%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fperson%20wdt%3AP2013%20%3Ffacebook%20%7D%20.%0A%20%20%20%20%20%20%20%20%20%20OPTIONAL%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fwikipedia%20schema%3Aabout%20%3Fperson%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fwikipedia%20schema%3AinLanguage%20%22en%22%20.%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%3Fwikipedia%20schema%3AisPartOf%20%3Chttps%3A%2F%2Fen.wikipedia.org%2F%3E%20.%0A%20%20%20%20%20%20%20%20%20%20%7D%20.%0A%20%20%20%20%20%20%20%20%20%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22en%22.%20%7D%0A%20%20%20%20%20%20%20%20%7D%0A"
        r = requests.get(url, headers=headers)

        return r.json()["results"]["bindings"]

    def import_mps(self):
        data = self.get_mp_data()
        type_names = {
            "parlid": {"label": "MP Parliament ID"},
            "twfyid": {"label": "MP TheyWorkForYou ID"},
            "twitter": {"label": "MP Twitter username"},
            "facebook": {"label": "MP Facebook username"},
            "wikipedia": {"label": "MP Wikipedia article"},
            "party": {"label": "MP party"},
        }
        data_types = {}
        if not self._quiet:
            print("Importing type names")
        for data_type, props in tqdm(type_names.items(), disable=self._quiet):
            defaults = {
                "data_type": "profile_id",
                "description": props["label"],
                "label": props["label"],
                "source": "https://en.wikipedia.org/",
                "source_label": "Wikipedia",
                "table": "person__persondata",
                "is_filterable": False,
            }
            if data_type == "party":
                defaults["is_filterable"] = True
                defaults["comparators"] = DataSet.in_comparators()
            ds, created = DataSet.objects.update_or_create(
                name=data_type, defaults=defaults
            )
            dt, created = DataType.objects.get_or_create(
                data_set=ds,
                name=data_type,
                defaults={"label": props["label"], "data_type": "profile_id"},
            )
            data_types[data_type] = dt

        del type_names["party"]

        if not self._quiet:
            print("Importing MPs")
        for mp in tqdm(data, disable=self._quiet):

            area = Area.get_by_gss(mp["gss_code"]["value"], area_type=self.area_type)
            if area is None:  # pragma: no cover
                print(
                    "Failed to add MP {} as area {} does not exist"
                    % mp["personLabel"]["value"],
                    mp["gss_code"]["value"],
                )
                continue

            if area and "parlid" in mp:
                person, created = Person.objects.update_or_create(
                    person_type="MP",
                    external_id=mp["parlid"]["value"],
                    id_type="parlid",
                    defaults={
                        "name": mp["personLabel"]["value"],
                        "area": area,
                    },
                )

            if person:
                for prop in type_names.keys():
                    if prop in mp:
                        try:
                            PersonData.objects.update_or_create(
                                person=person,
                                data_type=data_types[prop],
                                defaults={"data": mp[prop]["value"]},
                            )
                        except PersonData.MultipleObjectsReturned:  # pragma: no cover
                            PersonData.objects.filter(
                                person=person, data_type=data_types[prop]
                            ).delete()
                            PersonData.objects.create(
                                person=person,
                                data_type=data_types[prop],
                                data=mp[prop]["value"],
                            )
                if "partyLabel" in mp:
                    try:
                        PersonData.objects.get_or_create(
                            person=person,
                            data_type=data_types["party"],
                            defaults={"data": mp["partyLabel"]["value"]},
                        )
                    except PersonData.MultipleObjectsReturned:  # pragma: no cover
                        PersonData.objects.filter(
                            person=person, data_type=data_types["party"]
                        ).delete()
                        PersonData.objects.create(
                            person=person,
                            data_type=data_types["party"],
                            data=mp["partyLabel"]["value"],
                        )

        dataset = DataSet.objects.filter(name="party", options=list())
        if dataset:
            parties = list()
            all_parties = list(
                PersonData.objects.filter(
                    data_type__data_set__name="party"
                ).values_list("data")
            )

            for (party, count) in Counter(all_parties).most_common():
                shade = party_shades.get(party[0], "#DCDCDC")
                parties.append(dict(title=party[0], shader=shade))

            dataset.update(options=parties)

    def import_mp_images(self):
        path = settings.MEDIA_ROOT / "person"
        if not path.exists():  # pragma: nocover
            path.mkdir(parents=True)
        if not self._quiet:
            print("Importing MP Images")
        for mp in tqdm(
            Person.objects.filter(person_type="MP").all(), disable=self._quiet
        ):
            image_url = f"https://members-api.parliament.uk/api/Members/{mp.external_id}/Thumbnail"
            file, headers = urllib.request.urlretrieve(image_url)
            mime_type = magic.from_file(file, mime=True)
            extension = mime_type.split("/")[1]
            image = File(open(file, "rb"))
            mp.photo.save(f"mp_{mp.external_id}.{extension}", image)
            mp.save()

    def check_for_duplicate_mps(self):
        duplicates = (
            Person.objects.distinct()
            .values("area_id")
            .annotate(area_count=Count("area_id"))
            .filter(area_count__gt=1)
        )
        if duplicates.count() > 0:
            print(
                f"Duplicate MPs found for {str(duplicates.count())} area(s). Removing duplicates"
            )
            # First, get the election results so that we can compare elected dates
            call_command("import_mps_election_results")

            # Remove all duplicate MPs
            for area in duplicates:
                duplicate_mps = Person.objects.filter(area=area["area_id"]).values_list(
                    "external_id", flat=True
                )
                least_recent_mp = (
                    PersonData.objects.filter(
                        data_type__data_set__name="mp_last_elected"
                    )
                    .filter(person__external_id__in=duplicate_mps)
                    .latest("date")
                    .person.external_id
                )
                mps_to_delete = list(duplicate_mps)
                mps_to_delete.remove(least_recent_mp)
                Person.objects.filter(external_id__in=mps_to_delete).delete()

            print("Rerunning MP import scripts")
            for command_name in MP_IMPORT_COMMANDS:
                call_command(command_name)
