from django.db import models


class Area(models.Model):
    mapit_id = models.CharField(max_length=30)
    gss = models.CharField(max_length=30)
    name = models.CharField(max_length=200)
    area_type = models.CharField(max_length=20)
