from django.contrib.gis.geos import Point


def create_point(latitude: float = 0, longitude: float = 0):
    return Point(x=float(longitude), y=float(latitude), srid=4326)


EERs = [
    {"code": "E15000001", "label": "North East"},
    {"code": "E15000002", "label": "North West"},
    {"code": "E15000003", "label": "Yorkshire and The Humber"},
    {"code": "E15000004", "label": "East Midlands"},
    {"code": "E15000005", "label": "West Midlands"},
    {"code": "E15000006", "label": "Eastern"},
    {"code": "E15000007", "label": "London"},
    {"code": "E15000008", "label": "South East"},
    {"code": "E15000009", "label": "South West"},
    {"code": "N07000001", "label": "Northern Ireland"},
    {"code": "S15000001", "label": "Scotland"},
    {"code": "W08000001", "label": "Wales"},
]
