# Provides a map from postcodes.io area type to Local Intelligence Hub
# area types, or mapit types if LIH is misaligned.


from enum import Enum
from typing import TYPE_CHECKING

import strawberry

if TYPE_CHECKING:
    from hub.models import Area


@strawberry.enum
class AnalyticalAreaType(Enum):
    parliamentary_constituency = "parliamentary_constituency"
    parliamentary_constituency_2024 = "parliamentary_constituency_2024"
    admin_district = "admin_district"
    admin_county = "admin_county"
    admin_ward = "admin_ward"
    postcode = "postcode"
    postcode_area = "postcode_area"
    postcode_district = "postcode_district"
    postcode_sector = "postcode_sector"
    european_electoral_region = "european_electoral_region"
    country = "country"
    msoa = "msoa"
    lsoa = "lsoa"
    output_area = "output_area"


lih_to_postcodes_io_key_map = {
    "WMC": AnalyticalAreaType.parliamentary_constituency,
    "WMC23": AnalyticalAreaType.parliamentary_constituency_2024,
    "WD23": AnalyticalAreaType.admin_ward,
    "WD": AnalyticalAreaType.admin_ward,
    "DIS": AnalyticalAreaType.admin_district,
    "STC": AnalyticalAreaType.admin_county,
    "EER": AnalyticalAreaType.european_electoral_region,
    "CTRY": AnalyticalAreaType.country,
    "OA21": AnalyticalAreaType.output_area,
    "PC": AnalyticalAreaType.postcode,
    "PCA": AnalyticalAreaType.postcode_area,
    "PCD": AnalyticalAreaType.postcode_district,
    "PCS": AnalyticalAreaType.postcode_sector,
}


def area_to_postcode_io_filter(area: "Area"):
    if area.mapit_type in ["LBO", "UTA", "COI", "LGD", "MTD", "DIS", "NMD"]:
        return AnalyticalAreaType.admin_district
    elif area.mapit_type in ["CTY"]:
        return AnalyticalAreaType.admin_county
    else:
        return lih_to_postcodes_io_key_map.get(area.area_type.code, None)
