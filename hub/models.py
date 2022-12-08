from datetime import datetime, timezone

from django.contrib.auth import get_user_model
from django.db import models
from django.dispatch import receiver

from django_jsonform.models.fields import JSONField

import utils as lih_utils
from hub.filters import Filter

User = get_user_model()


class TypeMixin:
    TYPE_CHOICES = [
        ("text", "Text"),
        ("integer", "Integer"),
        ("float", "Floating Point Number"),
        ("percent", "Percentage"),
        ("date", "Date"),
        ("boolean", "True/False"),
        ("profile_id", "Profile Id"),
        ("json", "JSON data"),
    ]

    @property
    def is_number(self):
        if self.data_type in ("integer", "float", "percent"):
            return True

        return False

    @property
    def is_percentage(self):
        if self.data_type == "percent":
            return True

        return False

    @property
    def is_float(self):
        if self.data_type == "float" or self.data_type == "percent":
            return True

        return False

    @property
    def is_date(self):
        if self.data_type == "date":
            return True

        return False

    @property
    def is_json(self):
        if self.data_type == "json":
            return True

        return False


class DataSet(TypeMixin, models.Model):
    SOURCE_CHOICES = [
        ("csv", "CSV File"),
        ("xlxs", "Excel File"),
        ("api", "External API"),
    ]

    CATEGORY_CHOICES = [
        ("opinion", "Public Opinion"),
        ("place", "Place"),
        ("movement", "Movement"),
    ]

    TABLE_CHOICES = [
        ("areadata", "AreaData"),
        ("person__persondata", "PersonData"),
    ]

    COMPARATORS_SCHEMA = {
        "type": "array",
        "items": {
            "type": "dict",
            "keys": {"field_lookup": {"type": "string"}, "title": {"type": "string"}},
        },
        "minItems": 2,
    }

    def comparators_default():
        return [
            dict(field_lookup="exact", title="is"),
            dict(field_lookup="not_exact", title="is not"),
        ]

    def numerical_comparators():
        return [
            dict(field_lookup="gte", title="is equal or greater than"),
            dict(field_lookup="lt", title="is less than"),
        ]

    def year_comparators():
        return [
            dict(field_lookup="year__lt", title="before year"),
            dict(field_lookup="year__gte", title="since year"),
        ]

    OPTIONS_SCHEMA = {
        "type": "array",
        "items": {
            "type": "dict",
            "keys": {"title": {"type": "string"}, "shader": {"type": "string"}},
        },
    }

    def options_default():
        return []

    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    label = models.CharField(max_length=200, blank=True, null=True)
    data_type = models.CharField(max_length=20, choices=TypeMixin.TYPE_CHOICES)
    last_update = models.DateTimeField(auto_now=True)
    source_label = models.TextField(max_length=300, blank=True, null=True)
    source = models.CharField(max_length=200)
    source_type = models.TextField(
        max_length=50, blank=True, null=True, choices=SOURCE_CHOICES
    )
    data_url = models.URLField(blank=True, null=True)
    is_upload = models.BooleanField(default=False)
    is_range = models.BooleanField(default=False)
    featured = models.BooleanField(default=False)
    order = models.IntegerField(blank=True, null=True)
    category = models.TextField(blank=True, null=True, choices=CATEGORY_CHOICES)
    table = models.CharField(max_length=20, null=True, choices=TABLE_CHOICES)
    comparators = JSONField(schema=COMPARATORS_SCHEMA, default=comparators_default)
    options = JSONField(schema=OPTIONS_SCHEMA, blank=True, default=options_default)
    default_value = models.CharField(max_length=50, blank=True, null=True)
    is_filterable = models.BooleanField(default=True)

    def __str__(self):
        if self.label:
            return self.label

        return self.name

    @property
    def source_name(self):
        if self.source_label is not None:
            return self.source_label
        elif not self.source == "" and self.source is not None:
            return lih_utils.domain_human(self.source)
        elif not self.data_url == "" and self.data_url is not None:
            return lih_utils.domain_human(self.data_url)

        return "unknown"

    @property
    def source_url(self):
        if not self.source == "":
            return self.source

        return self.data_url

    class Meta:
        permissions = [
            ("order_and_feature", "Can change sort order and mark as featured")
        ]

    def filter(self, query, **kwargs):
        return Filter(self, query).run(**kwargs)

    def colours_for_areas(self, areas):
        values = self.shader_value(areas)
        colours = {}
        for value in values:
            opacity = (
                value.opacity(value.data_type.minimum, value.data_type.maximum) or 0.7
            )
            data = value.value()
            colours[value.gss] = {"colour": "#ed6832", "opacity": opacity}
            for option in self.options:
                if option["title"] == data:
                    colours[value.gss] = {
                        "colour": option["shader"],
                        "opacity": opacity,
                    }

        return colours

    def shader_value(self, area):
        if self.table == "areadata":
            data = (
                AreaData.objects.filter(area__in=area, data_type__data_set=self)
                .select_related("area", "data_type")
                .annotate(gss=models.F("area__gss"))
            )
            return data
        else:
            data = (
                PersonData.objects.filter(
                    person__area__in=area, data_type__data_set=self
                )
                .select_related("person__area", "data_type")
                .annotate(gss=models.F("person__area__gss"))
            )
            return data

        return None


class DataType(TypeMixin, models.Model):
    data_set = models.ForeignKey(DataSet, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    data_type = models.CharField(max_length=20, choices=TypeMixin.TYPE_CHOICES)
    last_update = models.DateTimeField(auto_now=True)
    average = models.FloatField(blank=True, null=True)
    maximum = models.FloatField(blank=True, null=True)
    minimum = models.FloatField(blank=True, null=True)
    label = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(blank=True, null=True)

    def __str__(self):
        if self.label:
            return self.label

        return self.name


class UserDataSets(models.Model):
    data_set = models.ForeignKey(DataSet, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)


class CommonData(models.Model):
    data_type = models.ForeignKey(DataType, on_delete=models.CASCADE)
    data = models.CharField(max_length=200)
    date = models.DateTimeField(blank=True, null=True)
    float = models.FloatField(blank=True, null=True)
    int = models.IntegerField(blank=True, null=True)
    json = models.JSONField(blank=True, null=True)

    def value(self):
        try:
            if self.is_date:
                return self.date
            elif self.is_float:
                return self.float
            elif self.is_number:
                return self.int
            elif self.is_json:
                return self.json
        except ValueError:
            return self.data

        return self.data

    def opacity(self, min, max):
        if self.is_number:
            if max == min:
                opacity = 100
            else:
                inc = (max - min) / 100
                opacity = (self.value() - min) / inc
            return opacity / 100
        return 100

    @property
    def average(self):
        return self.data_type.average

    @property
    def label(self):
        return self.data_type.label

    @property
    def is_number(self):
        return self.data_type.is_number

    @property
    def is_percentage(self):
        return self.data_type.is_percentage

    @property
    def is_float(self):
        return self.data_type.is_float

    @property
    def is_date(self):
        return self.data_type.is_date

    @property
    def is_json(self):
        return self.data_type.is_json

    class Meta:
        abstract = True


class Area(models.Model):
    mapit_id = models.CharField(max_length=30)
    gss = models.CharField(unique=True, max_length=30)
    name = models.CharField(max_length=200)
    area_type = models.CharField(max_length=20)
    geometry = models.TextField(blank=True, null=True)

    def get_absolute_url(self):
        return f"/area/{self.area_type}/{self.name}"

    def get_value(self, dataset):
        area = self

        if dataset.table == "areadata":
            scope = area.areadata_set
        else:
            person = area.person_set.first()
            scope = person.persondata_set if person else None

        if scope is None:
            return None

        data = scope.get(data_type__data_set=dataset)
        return data.value() if data else None


class AreaData(CommonData):
    area = models.ForeignKey(Area, on_delete=models.CASCADE)


class Person(models.Model):
    person_type = models.CharField(max_length=10)
    external_id = models.CharField(db_index=True, max_length=20)
    id_type = models.CharField(max_length=10)
    name = models.CharField(max_length=200)
    area = models.ForeignKey(Area, on_delete=models.CASCADE)
    photo = models.ImageField(null=True, upload_to="person")

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        area = self.area
        return f"/area/{area.area_type}/{area.name}"

    class Meta:
        unique_together = ("external_id", "id_type")
        indexes = [models.Index(fields=["external_id", "id_type"])]


class PersonData(CommonData):
    person = models.ForeignKey(Person, on_delete=models.CASCADE)


@receiver(models.signals.pre_save, sender=AreaData)
@receiver(models.signals.pre_save, sender=PersonData)
def cast_data(sender, instance, *args, **kwargs):
    if instance.is_date and instance.date is None and instance.data:
        date = datetime.fromisoformat(instance.data)
        # parliament API does not add timezones to things that are dates so we
        # need to add them
        if date.tzinfo is None:
            date = date.replace(tzinfo=timezone.utc)
        instance.date = date
        instance.data = ""

    elif instance.is_float and instance.float is None and instance.data:
        instance.float = float(instance.data)
        instance.data = ""

    elif instance.is_number and instance.int is None and instance.data:
        instance.int = int(instance.data)
        instance.data = ""
