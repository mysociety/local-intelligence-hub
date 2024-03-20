from enum import Enum
from typing import List, Optional, Union
from django.contrib.gis.geos import Point, Polygon, MultiPolygon

import strawberry
from strawberry.scalars import JSON

#

@strawberry.enum
class GeoJSONTypes(Enum):
    Feature = "Feature"
    FeatureCollection = "FeatureCollection"
    Point = "Point"
    Polygon = "Polygon"
    MultiPolygon = "MultiPolygon"

#

@strawberry.type
class FeatureCollection:
    type: GeoJSONTypes.FeatureCollection = GeoJSONTypes.FeatureCollection
    features: List["Feature"]

#

@strawberry.interface
class Feature:
    type: GeoJSONTypes.Feature = GeoJSONTypes.Feature
    id: Optional[str]
    # properties: Optional[JSON]

#

@strawberry.type
class PointGeometry:
    type: GeoJSONTypes.Point = GeoJSONTypes.Point
    # lng, lat
    coordinates: List[float]

@strawberry.type
class PointFeature(Feature):
    geometry: PointGeometry
    properties: JSON

    @classmethod
    def from_geodjango(cls, point: Point, properties: dict = {}, id: str = None) -> "PointFeature":
        return PointFeature(
            id=str(id),
            geometry=PointGeometry(coordinates=point),
            properties=properties,
        )

#
    
@strawberry.type
class PolygonGeometry:
    type: GeoJSONTypes.Polygon = GeoJSONTypes.Polygon
    coordinates: List[List[List[float]]]

@strawberry.type
class PolygonFeature(Feature):
    geometry: PolygonGeometry
    properties: JSON

    @classmethod
    def from_geodjango(cls, polygon: Polygon, properties: dict = {}, id: str = None) -> "PolygonFeature":
        return PolygonFeature(
            id=str(id),
            geometry=PolygonGeometry(coordinates=polygon),
            properties=properties,
        )

#
    
@strawberry.type
class MultiPolygonGeometry:
    type: GeoJSONTypes.MultiPolygon = GeoJSONTypes.MultiPolygon
    coordinates: List[List[List[List[float]]]]

@strawberry.type
class MultiPolygonFeature(Feature):
    geometry: MultiPolygonGeometry
    properties: JSON

    @classmethod
    def from_geodjango(cls, multipolygon: MultiPolygon, properties: dict = {}, id: str = None) -> "MultiPolygonFeature":
        return MultiPolygonFeature(
            id=str(id),
            geometry=MultiPolygonGeometry(coordinates=multipolygon),
            properties=properties,
        )