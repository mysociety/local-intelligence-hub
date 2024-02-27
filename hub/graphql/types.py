import strawberry_django
from strawberry import auto

from hub import models

@strawberry_django.type(models.Area)
class Area:
    id: auto
    mapit_id: auto
    gss: auto
    name: auto
    area_type: 'AreaType'
    geometry: auto
    overlaps: list['Area']

@strawberry_django.type(models.AreaType)
class AreaType:
    id: auto
    name: auto
    area_type: auto
    description: auto

    @strawberry_django.field
    def areas(self) -> list[Area]:
        return self.area_set.all()
