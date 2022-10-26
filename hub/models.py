from django.db import models


class DataType(models.Model):
    TYPE_CHOICES = [
        ("text", "Text"),
        ("number", "Number"),
        ("date", "Date"),
        ("boolean", "True/False"),
        ("profile_id", "Profile Id"),
    ]

    name = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    data_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    last_update = models.DateTimeField(auto_now=True)
    source = models.CharField(max_length=200)


class Area(models.Model):
    mapit_id = models.CharField(max_length=30)
    gss = models.CharField(unique=True, max_length=30)
    name = models.CharField(max_length=200)
    area_type = models.CharField(max_length=20)
    geometry = models.TextField(blank=True, null=True)


class Person(models.Model):
    person_type = models.CharField(max_length=10)
    external_id = models.CharField(db_index=True, max_length=20)
    id_type = models.CharField(max_length=10)
    name = models.CharField(max_length=200)
    area = models.ForeignKey(Area, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ("external_id", "id_type")
        indexes = [models.Index(fields=["external_id", "id_type"])]


class PersonData(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    data_type = models.ForeignKey(DataType, on_delete=models.CASCADE)
    data = models.CharField(max_length=200)
    date = models.DateTimeField(blank=True, null=True)

    def value(self):
        if self.data_type.data_type == "date":
            return self.date

        return self.data
