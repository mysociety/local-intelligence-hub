import urllib.request

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand

import magic
import requests
from tqdm import tqdm

from hub.models import Area, DataSet, DataType, Person, PersonData


class Command(BaseCommand):
    help = "Import UK Members of Parliament"

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )

    def handle(self, quiet: bool = False, *args, **options):
        self._quiet = quiet
        self.import_mps()
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
        type_names = ["parlid", "twfyid", "twitter", "facebook", "wikipedia", "party"]
        data_types = {}
        if not self._quiet:
            print("Importing type names")
        for data_type in tqdm(type_names, disable=self._quiet):
            ds, created = DataSet.objects.get_or_create(
                name=data_type,
                data_type="profile_id",
                source="https://en.wikipedia.org/",
            )
            dt, created = DataType.objects.get_or_create(
                data_set=ds,
                name=data_type,
                data_type="profile_id",
            )
            data_types[data_type] = dt

        type_names.remove("party")

        if not self._quiet:
            print("Importing MPs")
        for mp in tqdm(data, disable=self._quiet):
            try:
                area = Area.objects.get(gss=mp["gss_code"]["value"])
            except Area.DoesNotExist:  # pragma: no cover
                print(
                    "Failed to add MP {} as area {} does not exist"
                    % mp["personLabel"]["value"],
                    mp["gss_code"]["value"],
                )
                continue

            if area:
                person, created = Person.objects.get_or_create(
                    person_type="MP",
                    external_id=mp["parlid"]["value"],
                    id_type="parlid",
                    name=mp["personLabel"]["value"],
                    area=area,
                )

            if person:
                for prop in type_names:
                    if prop in mp:
                        PersonData.objects.get_or_create(
                            person=person,
                            data_type=data_types[prop],
                            data=mp[prop]["value"],
                        )
                if "partyLabel" in mp:
                    PersonData.objects.get_or_create(
                        person=person,
                        data_type=data_types["party"],
                        data=mp["partyLabel"]["value"],
                    )

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
