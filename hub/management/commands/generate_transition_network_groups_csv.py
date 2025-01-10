from django.conf import settings

import pandas as pd
import requests

from .base_generators import BaseLatLonGeneratorCommand


class Command(BaseLatLonGeneratorCommand):
    help = (
        "Generate CSV file of Transition Network groups with constituency information"
    )
    message = "Generating a CSV of Transition Network groups"

    out_file = settings.BASE_DIR / "data" / "transition_network_groups.csv"

    row_name = "group_name"
    uses_gss = True

    def get_dataframe(self):
        url = "https://maps.transitionnetwork.org/wp-json/cds/v1/initiatives/?country=GB&per_page=999"
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as e:
            print(f"Error reading remote file {url}: {e}")
            return None

        rows = []
        for i, item in enumerate(data["body"]):
            location = item.get("location", {})
            contact = item.get("contact", {})
            if location.get("lat") and location.get("lng"):
                rows.append(
                    {
                        "transition_network_id": item.get("id"),
                        "transition_network_url": item.get("url"),
                        "group_name": item.get("title"),
                        "group_url": contact.get("website"),
                        "group_facebook": contact.get("facebook"),
                        "lat_lon": f"{location.get('lat')},{location.get('lng')}",
                        "lat": location.get("lat"),
                        "lon": location.get("lng"),
                    }
                )
            else:
                print(
                    f"Group {i}, {item.get('title')} has no lat/lon so will be ignored"
                )

        return pd.DataFrame(rows)
