from django.contrib.gis.geos import Point


def create_point(latitude: float = 0, longitude: float = 0):
    return Point(x=float(longitude), y=float(latitude), srid=4326)
