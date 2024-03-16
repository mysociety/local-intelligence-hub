import strawberry_django
from typing import List, Union, Literal, Optional
from strawberry.scalars import JSON
from hub.graphql.utils import dict_key_field

@strawberry_django.type
class FeatureCollection:
    type: Literal["FeatureCollection"]
    features: List["Feature"]

@strawberry_django.type
class Feature:
    id: Optional[str]
    type: Literal["Feature"]
    geometry: Union["PointGeometry", "PolygonGeometry", "MultiPolygonGeometry"]
    properties: JSON

@strawberry_django.type
class PointGeometry:
    type: Literal["Point"]
    # lng, lat
    coordinates: List[float]

@strawberry_django.type
class PolygonGeometry:
    type: Literal["Polygon"]
    coordinates: List[List[List[float]]]

@strawberry_django.type
class MultiPolygonGeometry:
    type: Literal["MultiPolygon"]
    coordinates: List[List[List[List[float]]]]
