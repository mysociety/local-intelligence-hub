from typing import Optional

from django.contrib.gis.geos import Point

import strawberry

from hub.graphql.utils import dict_key_field

from .geojson import PointFeature


@strawberry.type
class PostcodesIOCodes:
    admin_district: str = dict_key_field()
    admin_county: str = dict_key_field()
    admin_ward: str = dict_key_field()
    parish: Optional[str] = dict_key_field()
    parliamentary_constituency: str = dict_key_field()
    parliamentary_constituency_2025: str = dict_key_field()
    ccg: str = dict_key_field()
    ccg_id: str = dict_key_field()
    ced: str = dict_key_field()
    nuts: str = dict_key_field()
    lsoa: str = dict_key_field()
    msoa: str = dict_key_field()
    lau2: str = dict_key_field()
    pfa: str = dict_key_field()


@strawberry.type
class PostcodesIOResult:
    postcode: str = dict_key_field()
    quality: int = dict_key_field()
    eastings: int = dict_key_field()
    northings: int = dict_key_field()
    country: str = dict_key_field()
    nhs_ha: str = dict_key_field()
    longitude: float = dict_key_field()
    latitude: float = dict_key_field()
    european_electoral_region: str = dict_key_field()
    primary_care_trust: str = dict_key_field()
    region: str = dict_key_field()
    lsoa: str = dict_key_field()
    msoa: str = dict_key_field()
    incode: str = dict_key_field()
    outcode: str = dict_key_field()
    parliamentary_constituency: str = dict_key_field()
    parliamentary_constituency_2025: str = dict_key_field()
    admin_district: str = dict_key_field()
    parish: str = dict_key_field()
    date_of_introduction: int = dict_key_field()
    admin_ward: str = dict_key_field()
    ccg: str = dict_key_field()
    nuts: str = dict_key_field()
    pfa: str = dict_key_field()
    codes: PostcodesIOCodes = dict_key_field()
    admin_county: Optional[str] = dict_key_field()
    ced: Optional[str] = dict_key_field()

    @strawberry.field
    def feature(self, info: strawberry.types.info.Info) -> PointFeature:
        return PointFeature.from_geodjango(
            point=Point(self.longitude, self.latitude), properties=self
        )
