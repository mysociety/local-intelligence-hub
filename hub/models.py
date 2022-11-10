from django.db import models


class DataSet(models.Model):
    SOURCE_CHOICES = [
        ("csv", "CSV File"),
        ("xlxs", "Excel File"),
        ("api", "External API"),
    ]

    TYPE_CHOICES = [
        ("text", "Text"),
        ("integer", "Integer"),
        ("float", "Floating Point Number"),
        ("percent", "Percentage"),
        ("date", "Date"),
        ("boolean", "True/False"),
        ("profile_id", "Profile Id"),
    ]

    CATEGORY_CHOICES = [
        ("opinion", "Public Opinion"),
        ("place", "Place"),
        ("movement", "Movement"),
    ]

    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)
    label = models.CharField(max_length=200, blank=True, null=True)
    data_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
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

    def __str__(self):
        if self.label:
            return self.label

        return self.name

    class Meta:
        permissions = [
            ("order_and_feature", "Can change sort order and mark as featured")
        ]


class DataType(models.Model):
    TYPE_CHOICES = [
        ("text", "Text"),
        ("integer", "Integer"),
        ("float", "Floating Point Number"),
        ("percent", "Percentage"),
        ("date", "Date"),
        ("boolean", "True/False"),
        ("profile_id", "Profile Id"),
    ]

    data_set = models.ForeignKey(DataSet, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    data_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    last_update = models.DateTimeField(auto_now=True)
    average = models.FloatField(blank=True, null=True)
    label = models.CharField(max_length=200, blank=True, null=True)

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


class CommonData(models.Model):
    data_type = models.ForeignKey(DataType, on_delete=models.CASCADE)
    data = models.CharField(max_length=200)
    date = models.DateTimeField(blank=True, null=True)

    def value(self):
        try:
            if self.is_date:
                return self.date
            elif self.is_float:
                return float(self.data)
            elif self.is_number:
                return int(self.data)
        except ValueError:
            return self.data

        return self.data

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
