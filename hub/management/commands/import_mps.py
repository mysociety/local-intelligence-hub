import urllib.request
from collections import Counter
from datetime import date

from django.conf import settings
from django.core.files import File
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db.models import Count
from django.db.utils import DataError

import magic
import pandas as pd
import requests
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
    "Reclaim": "#101122",
    "independent politician": "#DCDCDC",
}

party_map = {
    "Conservative": "Conservative Party",
    "Conservative and Unionist Party": "Conservative Party",
    "Green": "Green Party",
    "Green Party (England & Wales)": "Green Party",
    "SDLP (Social Democratic & Labour Party)": "Social Democratic and Labour Party",
    "DUP": "Democratic Unionist Party",
    "Labour": "Labour Party",
    "Labour/Co-operative": "Labour Co-operative",
    "Speaker": "Speaker of the House of Commons",
    "Liberal Democrat": "Liberal Democrats",
    "Alba": "Alba Party",
    "Independent": "independent politician",
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

    def standardise_party(self, party):
        orig_party = party
        if party_shades.get(party, None) is not None:
            return party

        if party_map.get(party, None) is not None:
            return party_map[party]

        return orig_party

    # these are separate functions so we can mock them in tests
    def get_twfy_df(self):
        df = pd.read_csv("https://www.theyworkforyou.com/mps/?f=csv").rename(
            columns={"Person ID": "twfyid"}
        )

        return df

    def get_id_df(self):
        df = pd.read_csv(
            "https://pages.mysociety.org/politician_data/data/uk_politician_data/latest/person_identifiers.csv",
            dtype={"person_id": str, "identifier": str},
        ).rename(columns={"person_id": "twfyid"})

        return df

    def get_parliament_ids_df(self):
        id_df = self.get_id_df()
        id_df = id_df.loc[id_df["scheme"] == "datadotparl_id"].copy()
        id_df["twfyid"] = id_df["twfyid"].str.replace(
            "uk.org.publicwhip/person/", "", regex=False
        )
        id_df["twfyid"] = pd.to_numeric(id_df["twfyid"])
        id_df = id_df.drop(columns=["scheme"])
        id_df = id_df.rename(columns={"identifier": "parlid"})

        return id_df

    def get_area_map(self):
        areas = Area.objects.filter(area_type__code="WMC").all()
        area_gss_lookup = {}
        for area in areas:
            area_gss_lookup[area.name] = area.gss

        return area_gss_lookup

    def get_social_media_information(self):
        headers = {
            "Accept": "application/json",
            "User-Agent": "Local Intelligence Hub beta",
        }
        query = """
        SELECT DISTINCT ?person ?personLabel ?twfyid ?partyLabel ?seatLabel ?gss_code ?twitter ?facebook ?wikipedia WHERE
        {
          ?person wdt:P31 wd:Q5 . ?person p:P39 ?ps .
          ?ps ps:P39 ?term . ?term wdt:P279 wd:Q16707842 .
          ?ps pq:P580 ?start . ?ps pq:P4100 ?party . ?ps pq:P768 ?seat .
          # During election
          # FILTER NOT EXISTS { ?ps pq:P582 ?end } .
          ?seat wdt:P836 ?gss_code .
          OPTIONAL { ?person wdt:P2002 ?twfyid } .
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
        # create an encoded url using the above
        url = f"https://query.wikidata.org/sparql?query={urllib.parse.quote(query)}"
        r = requests.get(url, headers=headers)

        # munge the wikidata JSON into a set of dicts so we can turn it into a dataframe
        records = r.json()["results"]["bindings"]
        data = []
        for record in records:
            row = {}
            for label, values in record.items():
                row[label] = values["value"]
            data.append(row)

        wiki_df = pd.DataFrame(data)
        # when not a number use null
        wiki_df["twfyid"] = pd.to_numeric(wiki_df["twfyid"], errors="coerce")

        return wiki_df

    def get_mp_data(self):
        # get MP data
        df = self.get_twfy_df()

        # get parliament IDs and match them to MPs
        id_df = self.get_parliament_ids_df()
        df = df.merge(id_df, how="left", on="twfyid")

        # add GSS codes
        area_map = self.get_area_map()
        df["gss_code"] = df["Constituency"].map(area_map)

        # Get wikidata for twitter ids etc
        wiki_df = self.get_social_media_information()
        df = df.merge(wiki_df, how="left", on="twfyid")

        return df

    def import_mps(self):
        data = self.get_mp_data()
        sources = {
            "TWFY": {
                "source": "https://www.theyworkforyou.com",
                "source_label": "Data from TheyWorkForYou.",
            },
            "Wiki": {
                "source": "https://en.wikipedia.org/",
                "source_label": "Data from Wikipedia.",
            },
        }

        type_names = {
            "parlid": {"label": "MP Parliament ID", "source": "TWFY"},
            "twfyid": {"label": "MP TheyWorkForYou ID", "source": "TWFY"},
            "party": {"label": "MP party", "source": "TWFY"},
            "twitter": {"label": "MP Twitter username", "source": "Wiki"},
            "facebook": {"label": "MP Facebook username", "source": "Wiki"},
            "wikipedia": {"label": "MP Wikipedia article", "source": "Wiki"},
        }
        data_types = {}
        if not self._quiet:
            print("Importing type names")
        for data_type, props in tqdm(type_names.items(), disable=self._quiet):
            defaults = {
                "data_type": "profile_id",
                "label": props["label"],
                "release_date": str(date.today()),
                "source": sources[props["source"]]["source"],
                "source_label": sources[props["source"]]["source_label"],
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
        for _, mp in tqdm(data.iterrows(), disable=self._quiet, total=data.shape[0]):
            area = Area.get_by_name(mp["Constituency"], area_type=self.area_type)
            if area is None:  # pragma: no cover
                print(
                    "Failed to add MP {} as area {} does not exist" % mp["personLabel"],
                    mp["gss_code"],
                )
                continue

            if area and "twfyid" in mp:
                name = f"{mp['First name']} {mp['Last name']}"
                if pd.isna(mp["twfyid"]):
                    print(f"No twfyid for {name}, not updating")
                    continue

                try:
                    person, created = Person.objects.update_or_create(
                        person_type="MP",
                        external_id=mp["twfyid"],
                        id_type="twfyid",
                        defaults={
                            "name": name,
                            "area": area,
                        },
                    )
                except DataError as e:
                    print(f"Failed to create/update mp {name}: {e}")
                    continue

            if person:
                for prop in type_names.keys():
                    if prop in mp and not pd.isna(mp[prop]):
                        try:
                            PersonData.objects.update_or_create(
                                person=person,
                                data_type=data_types[prop],
                                defaults={"data": mp[prop]},
                            )
                        except PersonData.MultipleObjectsReturned:  # pragma: no cover
                            PersonData.objects.filter(
                                person=person, data_type=data_types[prop]
                            ).delete()
                            PersonData.objects.create(
                                person=person,
                                data_type=data_types[prop],
                                data=mp[prop],
                            )
                if "Party" in mp:
                    try:
                        party = self.standardise_party(mp["Party"])
                        PersonData.objects.update_or_create(
                            person=person,
                            data_type=data_types["party"],
                            defaults={"data": party},
                        )
                    except PersonData.MultipleObjectsReturned:  # pragma: no cover
                        PersonData.objects.filter(
                            person=person, data_type=data_types["party"]
                        ).delete()
                        PersonData.objects.create(
                            person=person,
                            data_type=data_types["party"],
                            data=mp["Party"],
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

    def import_mp_images(self):
        path = settings.MEDIA_ROOT / "person"
        if not path.exists():  # pragma: nocover
            path.mkdir(parents=True)
        if not self._quiet:
            print("Importing MP Images")
        for mp in tqdm(
            PersonData.objects.filter(
                data_type__name="parlid", person__person_type="MP"
            )
            .select_related("person")
            .all(),
            disable=self._quiet,
        ):
            image_url = (
                f"https://members-api.parliament.uk/api/Members/{mp.data}/Thumbnail"
            )
            file, headers = urllib.request.urlretrieve(image_url)
            mime_type = magic.from_file(file, mime=True)
            extension = mime_type.split("/")[1]
            image = File(open(file, "rb"))
            mp.person.photo.save(f"mp_{mp.data}.{extension}", image)
            mp.person.save()

    def check_for_duplicate_mps(self):
        duplicates = (
            Person.objects.filter(person_type="MP")
            .distinct()
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
                mps_to_delete = list(duplicate_mps)
                try:
                    least_recent_mp = (
                        PersonData.objects.filter(
                            data_type__data_set__name="mp_last_elected"
                        )
                        .filter(person__external_id__in=duplicate_mps)
                        .latest("date")
                        .person.external_id
                    )
                    mps_to_delete.remove(least_recent_mp)
                except PersonData.DoesNotExist:
                    # if someonehow we've never set this then we won't have the data
                    pass
                Person.objects.filter(external_id__in=mps_to_delete).delete()
