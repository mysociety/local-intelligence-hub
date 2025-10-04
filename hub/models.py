import re
from datetime import datetime, timezone
from operator import itemgetter

from django.contrib.auth import get_user_model
from django.contrib.sites.models import Site
from django.db import models
from django.db.models import Avg, FloatField, IntegerField, Max, Min
from django.db.models.functions import Cast, Coalesce
from django.dispatch import receiver
from django.template import TemplateDoesNotExist
from django.template.loader import get_template

from django_jsonform.models.fields import JSONField

import utils as lih_utils
from hub.filters import Filter

User = get_user_model()


class UserProperties(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    organisation_name = models.TextField(null=True, blank=True)
    full_name = models.TextField(null=True, blank=True)
    email_confirmed = models.BooleanField(default=False)
    account_confirmed = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)
    agreed_terms = models.BooleanField(default=False)
    sites = models.ManyToManyField(Site)

    def __str__(self):
        return self.user.username


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
        ("url", "URL"),
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

    @property
    def is_url(self):
        if self.data_type == "url":
            return True

        return False

    @property
    def is_boolean(self):
        if self.data_type == "boolean":
            return True

        return False

    @property
    def value_col(self):
        if self.is_date:
            return "date"
        elif self.is_float:
            return "float"
        elif self.is_number:
            return "int"
        elif self.is_url or self.is_json:
            return "json"
        elif self.is_json:
            return "json"
        elif self.is_boolean:
            return "bool"
        else:
            return "data"


class ShaderMixin:
    shades = [
        "#ffffd9",
        "#edf8b1",
        "#c7e9b4",
        "#7fcdbb",
        "#41b6c4",
        "#1d91c0",
        "#225ea8",
        "#253494",
        "#081d58",
    ]

    COLOUR_NAMES = {
        "red-500": "#CC3517",
        "orange-500": "#ED6832",
        "yellow-500": "#FEC835",
        "teal-600": "#068670",
        "blue-500": "#21A8E0",
        "purple-500": "#6F42C1",
        "gray-500": "#ADB5BD",
        "gray-300": "#DEE2E6",
        "green-500": "#4CAF50",
        "green-400": "#66BB6A",
        "green-300": "#81C784",
        "orange-400": "#FFA726",
        "orange-300": "#FFB74D",
    }

    @property
    def shader_table(self):
        return self.table

    @property
    def shader_filter(self):
        return {"data_type__data_set": self}

    def shade(self, val, cmin, cmax):
        if val == "":
            return None
        try:
            x = float(val - cmin) / (cmax - cmin)
        except ZeroDivisionError:
            x = 0.5  # cmax == cmin

        shade = int(x * 9) - 1
        if shade < 0:
            shade = 0
        return self.shades[shade]

    def colours_for_areas(self, areas):
        if len(areas) == 0:
            return {"properties": {"no_areas": True}}

        values, mininimum, maximum = self.shader_value(areas)
        legend = {}
        if self.is_boolean:
            legend = {
                "Yes": self.COLOUR_NAMES["green-500"],
                "No": self.COLOUR_NAMES["red-500"],
            }
        elif hasattr(self, "options"):
            for option in self.options:
                if option.get("shader", None) is not None:
                    legend[option["title"]] = self.COLOUR_NAMES.get(
                        option["shader"], option["shader"]
                    )

        if len(legend) > 0:
            props = {"properties": {"legend": legend}}
        else:
            d_max = maximum
            d_min = mininimum
            if self.is_float:
                d_max = round(maximum, 1)
                d_min = round(mininimum, 1)
                if self.is_percentage:
                    d_max = f"{d_max}%"
                    d_min = f"{d_min}%"

            props = {
                "properties": {
                    "maximum": d_max,
                    "minimum": d_min,
                    "shades": self.shades,
                }
            }
        colours = {}
        for value in values:
            data = value.value()
            if self.is_boolean:
                val = "Yes" if data else "No"
                colours[value.gss] = {
                    "colour": legend[val],
                    "opacity": value.opacity(mininimum, maximum) or 0.7,
                    "value": val,
                    "label": self.label,
                }
            elif hasattr(self, "options"):
                for option in self.options:
                    if option["title"] == data:
                        colours[value.gss] = {
                            "colour": self.COLOUR_NAMES.get(
                                option["shader"], option["shader"]
                            ),
                            "opacity": value.opacity(mininimum, maximum) or 0.7,
                            "value": data,
                            "label": self.label,
                        }

            if self.is_number and colours.get(value.gss, None) is None:
                shade = self.shade(data, mininimum, maximum)
                if shade is not None:
                    colours[value.gss] = {
                        "colour": shade,
                        "opacity": 0.7,
                        "label": self.label,
                        "value": data,
                    }

        # if there is no data for an area then need to set the shader to opacity 0 otherwise
        # they will end up as the default
        missing = {}
        for area in areas:
            if colours.get(area.gss, None) is None:
                missing[area.gss] = {"colour": "#ed6832", "opacity": 0}

        return {**colours, **missing, **props}

    def shader_value(self, area):
        if self.shader_table == "areadata":
            if self.is_boolean:
                shader_min = None
                shader_max = None
            else:
                min_max = AreaData.objects.filter(
                    area__in=area, **self.shader_filter
                ).aggregate(
                    max=models.Max(self.value_col),
                    min=models.Min(self.value_col),
                )
                shader_min = min_max["min"]
                shader_max = min_max["max"]

            data = (
                AreaData.objects.filter(area__in=area, **self.shader_filter)
                .select_related("area", "data_type")
                .annotate(
                    gss=models.F("area__gss"),
                )
            )
            return data, shader_min, shader_max
        else:
            pd = PersonData.objects.filter(
                person__areas__in=area,
                **self.shader_filter,
            )
            if self.person_type is not None:
                pd = pd.filter(person__personarea__person_type=self.person_type)
            min_max = pd.aggregate(
                max=models.Max(self.value_col),
                min=models.Min(self.value_col),
            )

            data = pd.select_related("data_type").annotate(
                gss=models.F("person__areas__gss")
            )
            return data, min_max["min"], min_max["max"]

        return None, None, None


class SiteDataSet(models.Model):
    dataset = models.ForeignKey("DataSet", on_delete=models.CASCADE)
    site = models.ForeignKey(Site, on_delete=models.CASCADE)
    enabled = models.BooleanField(default=True)


class DataSet(TypeMixin, ShaderMixin, models.Model):
    SOURCE_CHOICES = [
        ("csv", "CSV File"),
        ("xlxs", "Excel File"),
        ("api", "External API"),
    ]
    SUBCATEGORY_CHOICES = [
        ("net_zero_support", "Support for net zero"),
        ("renewable_energy", "Renewable energy"),
        ("voting", "Voting"),
        ("government_action", "Government action"),
        ("supporters_and_activists", "Supporters and activists"),
        ("groups", "Groups"),
        ("places_and_spaces", "Places and spaces"),
        ("events", "Events"),
        ("cost_of_living", "Cost of living"),
    ]

    CATEGORY_CHOICES = [
        ("opinion", "Public Opinion"),
        ("place", "Place"),
        ("movement", "Movement"),
    ]

    TABLE_CHOICES = [
        ("areadata", "AreaData"),
        ("people__persondata", "PersonData"),
    ]

    UNIT_TYPE_CHOICES = [
        ("raw", "Raw unit (e.g. people or buildings)"),
        ("percentage", "Percentage"),
        ("point", "Point data (e.g. lat/long)"),
    ]

    UNIT_DISTRIBUTION_CHOICES = [
        ("people_in_area", "Evenly distributed over people in an area"),
        ("physical_area", "Evenly distributed over a physical area"),
        ("point", "Point data (recalculated)"),
    ]

    COMPARATORS_SCHEMA = {
        "type": "array",
        "items": {
            "type": "dict",
            "keys": {"field_lookup": {"type": "string"}, "title": {"type": "string"}},
        },
        "minItems": 2,
    }

    EXCLUDE_COUNTRIES_SCHEMA = {
        "type": "array",
        "items": {
            "type": "string",
        },
    }

    def comparators_default():
        return [
            dict(field_lookup="exact", title="is"),
            dict(field_lookup="not_exact", title="is not"),
        ]

    def exclude_countries_default():
        return []

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

    def string_comparators():
        return [
            dict(field_lookup="icontains", title="contains"),
            dict(field_lookup="not_icontains", title="does not contain"),
        ]

    def in_comparators():
        return [
            dict(field_lookup="in", title="is one of"),
            dict(field_lookup="not_in", title="is not one of"),
        ]

    def boolean_comparators():
        return [
            dict(field_lookup="true", title="Yes"),
            dict(field_lookup="false", title="No"),
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

    name = models.CharField(max_length=100, unique=True)
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
    release_date = models.TextField(blank=True, null=True)
    is_upload = models.BooleanField(default=False)
    is_range = models.BooleanField(default=False)
    featured = models.BooleanField(default=False)
    order = models.IntegerField(blank=True, null=True)
    category = models.TextField(blank=True, null=True, choices=CATEGORY_CHOICES)
    subcategory = models.TextField(blank=True, null=True, choices=SUBCATEGORY_CHOICES)
    table = models.CharField(max_length=20, null=True, choices=TABLE_CHOICES)
    comparators = JSONField(schema=COMPARATORS_SCHEMA, default=comparators_default)
    options = JSONField(schema=OPTIONS_SCHEMA, blank=True, default=options_default)
    default_value = models.CharField(max_length=50, blank=True, null=True)
    is_filterable = models.BooleanField(default=True)
    is_shadable = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False)
    fill_blanks = models.BooleanField(default=True)
    exclude_countries = JSONField(
        schema=EXCLUDE_COUNTRIES_SCHEMA, blank=True, default=exclude_countries_default
    )
    unit_type = models.TextField(null=True, choices=UNIT_TYPE_CHOICES)
    unit_distribution = models.TextField(null=True, choices=UNIT_DISTRIBUTION_CHOICES)
    areas_available = models.ManyToManyField("AreaType")
    person_type = models.CharField(max_length=10, null=True, blank=True)
    visible = models.BooleanField(default=True)
    sites = models.ManyToManyField(Site, through=SiteDataSet)

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


class SiteAreaType(models.Model):
    areatype = models.ForeignKey("AreaType", on_delete=models.CASCADE)
    site = models.ForeignKey(Site, on_delete=models.CASCADE)
    enabled = models.BooleanField(default=True)


class AreaType(models.Model):
    VALID_AREA_TYPES = ["WMC", "WMC23", "STC", "DIS", "PFA"]

    AREA_TYPES = [
        ("westminster_constituency", "Westminster Constituency"),
        ("single_tier_council", "Single Tier Council"),
        ("district_council", "District Council"),
        ("policing_area", "Policing Area"),
    ]

    code = models.CharField(max_length=10, unique=True)
    area_type = models.CharField(
        max_length=50, choices=AREA_TYPES
    )  # a general "type" of areaType (rather than a specific generation)
    name_singular = models.CharField(max_length=50)  # eg: "Parliamentary Constituency"
    name_plural = models.CharField(max_length=50)  # eg: "Parliamentary Constituencies"
    short_name_singular = models.CharField(max_length=50)  # eg: "constituency"
    short_name_plural = models.CharField(max_length=50)  # eg: "constituency"
    description = models.CharField(max_length=300)
    sites = models.ManyToManyField(Site, through=SiteAreaType)

    def __str__(self):
        return self.code


class DataType(TypeMixin, ShaderMixin, models.Model):
    data_set = models.ForeignKey(DataSet, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    data_type = models.CharField(max_length=20, choices=TypeMixin.TYPE_CHOICES)
    last_update = models.DateTimeField(auto_now=True)
    average = models.FloatField(blank=True, null=True)
    maximum = models.FloatField(blank=True, null=True)
    minimum = models.FloatField(blank=True, null=True)
    label = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(blank=True, null=True)
    area_type = models.ForeignKey(AreaType, on_delete=models.CASCADE, null=True)
    auto_converted = models.BooleanField(
        default=False,
        help_text="True if this has been auto converted from an area with overlapping geometry",
    )
    auto_converted_text = models.TextField(blank=True, null=True)

    def __str__(self):
        name = self.name
        if self.label:
            name = self.label

        if self.area_type:
            return f"{name} ({self.area_type})"

        return name

    def update_average(self):
        average = (
            AreaData.objects.filter(area__area_type=self.area_type, data_type=self)
            .annotate(
                cast_data=Cast(Coalesce("int", "float"), output_field=self.cast_field())
            )
            .all()
            .aggregate(Avg("cast_data"))
        )

        self.average = average["cast_data__avg"]
        self.save()

    def update_max_min(self):
        base = (
            AreaData.objects.filter(area__area_type=self.area_type, data_type=self)
            .annotate(
                cast_data=Cast(Coalesce("int", "float"), output_field=self.cast_field())
            )
            .all()
        )

        max = base.aggregate(Max("cast_data"))
        min = base.aggregate(Min("cast_data"))

        self.maximum = max["cast_data__max"]
        self.minimum = min["cast_data__min"]
        self.save()

    @property
    def cast_field(self):
        if self.is_float:
            return FloatField

        return IntegerField

    @property
    def shader_table(self):
        return self.data_set.table

    @property
    def shader_filter(self):
        return {"data_type": self}

    @property
    def auto_conversion_disclaimer(self):
        text = None
        if self.auto_converted:
            if self.auto_converted_text:
                text = self.auto_converted_text
            elif self.area_type.code == "WMC":
                text = "This dataset has been automatically converted from 2025 parliamentary constituencies."
            elif self.area_type.code == "WMC23":
                text = "This dataset has been automatically converted from 2010 parliamentary constituencies."
            else:
                text = "This dataset has been automatically converted from a different boundary type."

        return text


class UserDataSets(models.Model):
    data_set = models.ForeignKey(DataSet, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)


class CommonData(models.Model):
    data_type = models.ForeignKey(DataType, on_delete=models.CASCADE)
    data = models.CharField(max_length=400)
    date = models.DateTimeField(blank=True, null=True)
    float = models.FloatField(blank=True, null=True)
    int = models.IntegerField(blank=True, null=True)
    json = models.JSONField(blank=True, null=True)
    bool = models.BooleanField(blank=True, null=True)

    def value(self):
        try:
            if self.is_date:
                return self.date
            elif self.is_float:
                if self.float is None:
                    return 0
                return self.float
            elif self.is_number:
                if self.int is None:
                    return 0
                return self.int
            elif self.is_json or self.is_url:
                return self.json
            elif self.is_boolean:
                return self.bool
        except ValueError:
            return self.data

        return self.data

    def opacity(self, min, max):
        if self.is_number:
            inc = (max - min) / 100
            if max == min:
                opacity = 100
            elif self.value() == min:
                opacity = min / inc
            else:
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

    @property
    def is_url(self):
        return self.data_type.is_url

    @property
    def is_boolean(self):
        return self.data_type.is_boolean

    def _sorted_json(self, key):
        if not self.is_json:
            return None

        data = sorted(self.json, key=itemgetter(key))
        return data

    def sorted_groups(self):
        return self._sorted_json("group_name")

    def sorted_json(self):
        return self._sorted_json("name")

    class Meta:
        abstract = True


class Area(models.Model):
    mapit_id = models.CharField(max_length=30, null=True, blank=True)
    gss = models.CharField(max_length=30)
    name = models.CharField(max_length=200)
    area_type = models.ForeignKey(AreaType, on_delete=models.CASCADE)
    geometry = models.TextField(blank=True, null=True)
    overlaps = models.ManyToManyField("self", through="AreaOverlap")

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return f"/area/{self.area_type.code}/{self.name}"

    def get_value(self, dataset):
        area = self

        if dataset.table == "areadata":
            scope = area.areadata_set
        else:
            person = area.people.first()
            scope = person.persondata_set if person else None

        if scope is None:
            return None

        data = scope.get(data_type__data_set=dataset)
        return data.value() if data else None

    @classmethod
    def get_by_gss(cls, gss, area_type="WMC"):
        try:
            area = cls.objects.get(gss=gss, area_type__code=area_type)
        except cls.DoesNotExist:
            area = None

        return area

    @classmethod
    def get_by_name(cls, name, area_type="WMC"):
        try:
            area = cls.objects.get(name__iexact=name, area_type__code=area_type)
        except cls.DoesNotExist:
            area = None

        return area

    class Meta:
        unique_together = ["gss", "area_type"]


class AreaOverlap(models.Model):
    area_from = models.ForeignKey(
        Area, on_delete=models.CASCADE, related_name="overlaps_from"
    )
    area_to = models.ForeignKey(
        Area, on_delete=models.CASCADE, related_name="overlaps_to"
    )
    population_overlap = models.SmallIntegerField(default=0)
    area_overlap = models.SmallIntegerField(default=0)


class AreaData(CommonData):
    area = models.ForeignKey(Area, on_delete=models.CASCADE)


class SiteAreaAction(models.Model):
    action = models.ForeignKey("AreaAction", on_delete=models.CASCADE)
    site = models.ForeignKey(Site, on_delete=models.CASCADE)
    enabled = models.BooleanField(default=True)


class AreaAction(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    label = models.CharField(max_length=200, blank=True, null=True)
    last_update = models.DateTimeField(auto_now=True)
    start_date = models.DateTimeField(blank=True, null=True)
    end_date = models.DateTimeField(blank=True, null=True)
    is_public = models.BooleanField(default=False)
    require_session = models.BooleanField(default=False)
    passphrase = models.CharField(max_length=100, blank=True, null=True)
    visible = models.BooleanField(default=False)
    template = models.CharField(max_length=200, blank=True, null=True)
    sites = models.ManyToManyField(Site, through=SiteAreaAction)

    def get_template(self):
        template = "hub/area/_base_action.html"
        if self.template and re.fullmatch(r"^_[a-z0-9_\-]*\.html$", self.template):
            try:
                template = f"hub/area/action_templates/{self.template}"
                get_template(template)
            except TemplateDoesNotExist:
                template = "hub/area/_base_action.html"

        return template


class AreaActionData(models.Model):
    action = models.ForeignKey(AreaAction, on_delete=models.CASCADE)
    area = models.ForeignKey(Area, on_delete=models.CASCADE)
    data = models.JSONField(blank=True, null=True)
    markdown = models.TextField(blank=True, null=True)


class PersonArea(models.Model):
    area = models.ForeignKey(Area, on_delete=models.CASCADE)
    person = models.ForeignKey("Person", on_delete=models.CASCADE)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    person_type = models.CharField(max_length=10)


class Person(models.Model):
    person_type = models.CharField(max_length=10)
    external_id = models.CharField(db_index=True, max_length=20)
    id_type = models.CharField(max_length=30)
    name = models.CharField(max_length=200)
    old_area = models.ForeignKey(Area, null=True, blank=True, on_delete=models.CASCADE)
    areas = models.ManyToManyField(Area, through=PersonArea, related_name="people")
    photo = models.ImageField(null=True, upload_to="person")
    start_date = models.DateField(null=True)
    end_date = models.DateField(null=True)

    def __str__(self):
        return self.name

    def party(self):
        return PersonData.objects.get(
            person=self, data_type=DataType.objects.get(name="party")
        ).value()

    class Meta:
        unique_together = ("external_id", "id_type")
        indexes = [models.Index(fields=["external_id", "id_type"])]


class PersonData(CommonData):
    person = models.ForeignKey(Person, on_delete=models.CASCADE)


class Token(models.Model):
    DOMAINS = [("user", "User")]
    token = models.CharField(max_length=300)
    domain = models.CharField(max_length=50, choices=DOMAINS)
    domain_id = models.IntegerField()


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
