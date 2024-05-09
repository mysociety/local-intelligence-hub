from typing import Optional

from django.contrib.gis.geos import Point

import strawberry

from .geojson import PointFeature


@strawberry.type
class PostcodesIOCodes:
    admin_district: str
    admin_county: str
    admin_ward: str
    parish: Optional[str]
    parliamentary_constituency: str
    parliamentary_constituency_2025: str
    ccg: str
    ccg_id: str
    ced: str
    nuts: str
    lsoa: str
    msoa: str
    lau2: str
    pfa: str


@strawberry.type
class PostcodesIOResult:
    postcode: str
    quality: int
    eastings: int
    northings: int
    country: str
    nhs_ha: str
    longitude: float
    latitude: float
    european_electoral_region: str
    primary_care_trust: str
    region: str
    lsoa: str
    msoa: str
    incode: str
    outcode: str
    parliamentary_constituency: str
    parliamentary_constituency_2025: str
    admin_district: str
    parish: str
    date_of_introduction: int
    admin_ward: str
    ccg: str
    nuts: str
    pfa: str
    codes: PostcodesIOCodes
    admin_county: Optional[str]
    ced: Optional[str]

    @strawberry.field
    def feature(self, info: strawberry.types.info.Info) -> PointFeature:
        return PointFeature.from_geodjango(
            point=Point(self.longitude, self.latitude), properties=self
        )
