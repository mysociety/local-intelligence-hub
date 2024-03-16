from typing import List, Union, Optional
import strawberry
from strawberry.scalars import JSON
from hub.graphql.utils import dict_key_field
from typing import NewType
from enum import Enum

@strawberry.enum
class GeoJSONTypes(Enum):
    Feature = "Feature"
    FeatureCollection = "FeatureCollection"
    Point = "Point"
    Polygon = "Polygon"
    MultiPolygon = "MultiPolygon"

@strawberry.type
class FeatureCollection:
    type: GeoJSONTypes.FeatureCollection = GeoJSONTypes.FeatureCollection
    features: List["Feature"]

@strawberry.type
class Feature:
    id: Optional[str]
    type: GeoJSONTypes.Feature = GeoJSONTypes.Feature
    geometry: Union["PointGeometry", "PolygonGeometry", "MultiPolygonGeometry"]
    properties: JSON

@strawberry.interface
class Geometry:
    type: GeoJSONTypes

@strawberry.type
class PointGeometry(Geometry):
    type: GeoJSONTypes.Point = GeoJSONTypes.Point
    # lng, lat
    coordinates: List[float]

@strawberry.type
class PolygonGeometry(Geometry):
    type: GeoJSONTypes.Polygon = GeoJSONTypes.Polygon
    coordinates: List[List[List[float]]]

@strawberry.type
class MultiPolygonGeometry(Geometry):
    type: GeoJSONTypes.MultiPolygon = GeoJSONTypes.MultiPolygon
    coordinates: List[List[List[List[float]]]]
