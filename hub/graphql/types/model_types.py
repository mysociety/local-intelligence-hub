from datetime import datetime
from typing import List, Optional, Union

import procrastinate.contrib.django.models
import strawberry
import strawberry_django
from strawberry import auto
from strawberry.scalars import JSON
from strawberry.types.info import Info
from strawberry_django.auth.utils import get_current_user
import strawberry_django_dataloaders.fields
from strawberry_django.fields.field import StrawberryDjangoField
from django.db.models.fields.related import RelatedField
from django.db.models import Model as DjangoModel
from django.db.models import ManyToOneRel

from hub import models
from hub.graphql.types.geojson import MultiPolygonFeature, PointFeature
from hub.graphql.types.postcodes import PostcodesIOResult
from hub.graphql.utils import attr_field, dict_key_field, fn_field
from hub.graphql.dataloaders import FieldDataLoaderFactory, FieldReturningListDataLoaderFactory, filterable_dataloader_resolver, ReverseFKWithFiltersDataLoaderFactory
from hub.management.commands.import_mps import party_shades

@strawberry_django.filters.filter(
    procrastinate.contrib.django.models.ProcrastinateJob, lookups=True
)
class QueueFilter:
    id: auto
    status: auto
    queue_name: auto
    task_name: auto
    scheduled_at: auto
    attempts: auto
    external_data_source_id: Optional[str]

    def filter_external_data_source_id(self, queryset, info, value):
        return queryset.filter(args__external_data_source_id=value)


@strawberry_django.type(
    procrastinate.contrib.django.models.ProcrastinateJob,
    filters=QueueFilter,
    pagination=True
)
class QueueJob:
    id: auto
    queue_name: auto
    task_name: auto
    lock: auto
    args: auto
    status: auto
    scheduled_at: auto
    attempts: auto
    queueing_lock: auto
    events: List["QueueEvent"] = strawberry_django_dataloaders.fields.auto_dataloader_field()

    @strawberry_django.field
    async def last_event_at(self, info) -> datetime:
        loader = FieldReturningListDataLoaderFactory.get_loader_class(
            "procrastinate.ProcrastinateEvent",
            field="job_id"
          )
        events = await loader(context=info.context).load(self.id)
        return max([event.at for event in events])

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        # Only list data sources that the user has access to
        user = get_current_user(info)
        my_external_data_sources = models.ExternalDataSource.objects.filter(
            organisation__members__user=user.id
        )
        return queryset.filter(
            args__external_data_source_id__in=[
                str(external_data_source.id)
                for external_data_source in my_external_data_sources
            ]
        )


@strawberry_django.type(procrastinate.contrib.django.models.ProcrastinateEvent)
class QueueEvent:
    id: auto
    job: QueueJob = strawberry_django_dataloaders.fields.auto_dataloader_field()
    type: auto
    at: auto


@strawberry_django.type(models.User)
class User:
    email: auto
    user_properties: "UserProperties"


@strawberry_django.type(models.UserProperties)
class UserProperties:
    user: User
    full_name: auto


@strawberry_django.type(models.Organisation)
class Organisation:
    id: auto
    name: auto
    slug: auto
    members: List["Membership"]
    external_data_sources: List["ExternalDataSource"]

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        return queryset.filter(members__user=user)


# Membership
@strawberry_django.type(models.Membership)
class Membership:
    id: auto
    user: User
    organisation: Organisation
    role: auto

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        return queryset.filter(user=user.id)


# ExternalDataSource


@strawberry.type
class FieldDefinition:
    value: str = dict_key_field()
    label: Optional[str] = dict_key_field()
    description: Optional[str] = dict_key_field()


@strawberry_django.filter(models.ExternalDataSource)
class ExternalDataSourceFilter:
    data_type: auto
    geography_column_type: auto
    
@strawberry.type
class DataSetOption:
    title: str = dict_key_field()
    shader: str = dict_key_field()

@strawberry_django.type(models.DataSet)
class DataSet:
    id: auto
    name: auto
    description: auto
    label: auto
    data_type: 'DataType' = strawberry_django_dataloaders.fields.auto_dataloader_field()
    last_update: auto
    source_label: auto
    source: auto
    source_type: auto
    options: List[DataSetOption]
    data_url: auto
    release_date: auto
    is_upload: auto
    is_range: auto
    featured: auto
    order: auto
    category: auto
    subcategory: auto
    table: auto
    # comparators: auto
    # options: auto
    default_value: auto
    is_filterable: auto
    is_shadable: auto
    is_public: auto
    fill_blanks: auto
    # exclude_countries: auto
    unit_type: auto
    unit_distribution: auto
    areas_available: auto
    external_data_source: 'ExternalDataSource' = strawberry_django_dataloaders.fields.auto_dataloader_field()

@strawberry_django.filter(models.DataType)
class DataTypeFilters:
    id: auto
    data_set: auto
    name: auto

@strawberry_django.type(models.DataType, filters=DataTypeFilters)
class DataType:
    id: auto
    data_set: 'DataSet' = strawberry_django_dataloaders.fields.auto_dataloader_field()
    name: auto
    data_type: auto
    last_update: auto
    average: auto
    maximum: auto
    minimum: auto
    label: auto
    description: auto
    order: auto
    area_type: auto
    auto_converted: auto
    auto_converted_text: auto


@strawberry_django.type(models.AreaType)
class AreaType:
    name: auto
    code: auto
    area_type: auto
    description: auto

    data_types: List[DataType] = strawberry_django_dataloaders.fields.auto_dataloader_field()


@strawberry_django.filter(models.CommonData, lookups=True)
class CommonDataFilter:
    data_type: DataTypeFilters
    int: auto
    date: auto
    data: auto
    float: auto


@strawberry_django.interface(models.CommonData)
class CommonData:
    data_type: 'DataType' = strawberry_django_dataloaders.fields.auto_dataloader_field()
    data: auto
    date: auto
    float: auto
    int: auto
    json: Optional[JSON]
    
    @strawberry_django.field
    def shade(self, info: Info) -> Optional[str]:
        # data -> dataType -> dataSet -> options -> shader for data
        # loader = ShaderLoaderFactory.get_loader_class(models.DataSet, field="name")
        shader_options = self.data_type.data_set.options
        if shader_options:
            return next(
                (option["shader"] for option in shader_options if option["title"] == self.data),
                None
            )


@strawberry_django.filter(models.AreaData, lookups=True)
class AreaDataFilter:
    id: auto
    data_type: DataTypeFilters


@strawberry_django.input(models.CommonData, partial=True)
class CommonDataLoaderFilter:
    data_type__name: str


@strawberry_django.type(models.AreaData, filters=CommonDataFilter)
class AreaData(CommonData):
    id: auto
    area: 'Area' = strawberry_django_dataloaders.fields.auto_dataloader_field()


@strawberry_django.filter(models.PersonData, lookups=True)
class PersonDataFilter:
    data_type: DataTypeFilters
    int: auto
    date: auto
    data: auto
    float: auto
    person: auto


@strawberry_django.input(models.PersonData, partial=True)
class PersonDataloaderFilter:
    data_type__name: str


@strawberry_django.type(models.PersonData, filters=PersonDataFilter)
class PersonData(CommonData):
    id: auto
    person: "Person" = strawberry_django_dataloaders.fields.auto_dataloader_field()


@strawberry_django.input(models.Person, partial=True)
class PersonFilter:
    person_type: str


@strawberry_django.type(models.Person)
class Person:
    id: auto
    person_type: auto
    external_id: auto
    id_type: auto
    name: auto
    area: 'Area' = strawberry_django_dataloaders.fields.auto_dataloader_field()
    photo: auto
    start_date: auto
    end_date: auto
    data: List[PersonData] = filterable_dataloader_resolver(
        filter_type=Optional[CommonDataLoaderFilter],
        # prefetch=["data_type", "data_type__data_set"],
    )
    datum: Optional[PersonData] = filterable_dataloader_resolver(
        filter_type=Optional[CommonDataLoaderFilter],
        single=True,
        field_name="data",
        # prefetch=["data_type", "data_type__data_set"],
    )


@strawberry_django.filter(models.Area, lookups=True)
class AreaFilter:
    id: auto
    gss: auto
    name: auto
    area_type: auto
    
@strawberry.type
class PartyResult:
    party: str
    votes: int

    @strawberry_django.field
    def shade(self, info: Info) -> str:
        return party_shades.get(self.party, "#DCDCDC")

@strawberry.type
class ConstituencyElectionResult:
    date: str
    stats: 'ConstituencyElectionStats'
    results: List[PartyResult]

@strawberry.type
class ConstituencyElectionStats:
    json: strawberry.Private[dict]

    date: str
    other: float
    result: str
    majority: int
    electorate: int
    county_name: str
    first_party: str
    region_name: str
    valid_votes: int
    country_name: str
    second_party: str
    invalid_votes: int
    member_gender: str
    ons_region_id: str
    member_surname: str
    declaration_time: str
    constituency_name: str
    constituency_type: str
    member_first_name: str

    @strawberry_django.field
    def first_party_result(self, info: Info) -> PartyResult:
        return PartyResult(
            party=self.first_party,
            votes=next(
                (party["votes"] for party in self.json["results"]
                if party["party"] == self.first_party),
                0
            )
        )

    @strawberry_django.field
    def second_party_result(self, info: Info) -> PartyResult:
        return PartyResult(
            party=self.second_party,
            votes=next(
                (party["votes"] for party in self.json["results"]
                if party["party"] == self.second_party),
                0
            )
        )

@strawberry_django.type(models.Area, filters=AreaFilter)
class Area:
    id: auto
    mapit_id: auto
    gss: auto
    name: auto
    area_type: 'AreaType' = strawberry_django_dataloaders.fields.auto_dataloader_field()
    geometry: auto
    overlaps: auto
    # So that we can pass in properties to the geojson Feature objects
    extra_geojson_properties: strawberry.Private[object]
    people: List[Person] = filterable_dataloader_resolver(
        filter_type=Optional[PersonFilter],
        # prefetch=[
        #     "data",
        #     "data__data_type",
        #     "data__data_type__data_set"
        # ],
    )
    person: Optional[Person] = filterable_dataloader_resolver(
        filter_type=Optional[PersonFilter],
        single=True,
        field_name="people",
        # prefetch=[
        #     "data",
        #     "data__data_type",
        #     "data__data_type__data_set"
        # ],
    )
    data: List[AreaData] = filterable_dataloader_resolver(
        filter_type=Optional[CommonDataLoaderFilter]
    )
    datum: Optional[AreaData] = filterable_dataloader_resolver(
        filter_type=Optional[CommonDataLoaderFilter],
        single=True,
        field_name="data"
    )
    @strawberry_django.field
    async def last_election(self, info: Info) -> Optional[ConstituencyElectionResult]:
        # return self.data.get(data_type__name="last_election")
        # # Create a dataloader for this
        loader = ReverseFKWithFiltersDataLoaderFactory.get_loader_class(
            "hub.AreaData",
            filters=CommonDataLoaderFilter(
                data_type__name="last_election"
            ),
            reverse_path="area_id"
        )
        res = await loader(context=info.context).load(self.id)
        if res is None or res[0] is None or res[0].json is None:
            return None
        result = res[0].json
        cer = ConstituencyElectionResult(
            date=result["date"],
            stats=ConstituencyElectionStats(
                **result["stats"],
                json=result
            ),
            results=[
                PartyResult(party=party["party"], votes=party["votes"])
                for party in result["results"]
            ]
        )
        return cer

    @strawberry_django.field
    def polygon(
        self, info: Info, with_parent_data: bool = False
    ) -> Optional[MultiPolygonFeature]:
        props = {"name": self.name, "gss": self.gss}
        if with_parent_data and hasattr(self, "extra_geojson_properties"):
            props["extra_geojson_properties"] = self.extra_geojson_properties

        return MultiPolygonFeature.from_geodjango(
            multipolygon=self.polygon, id=self.gss, properties=props
        )

    @strawberry_django.field
    def point(
        self, info: Info, with_parent_data: bool = False
    ) -> Optional[PointFeature]:
        props = {"name": self.name, "gss": self.gss}
        if with_parent_data and hasattr(self, "extra_geojson_properties"):
            props["extra_geojson_properties"] = self.extra_geojson_properties

        return PointFeature.from_geodjango(
            point=self.point, id=self.gss, properties=props
        )


@strawberry.type
class GroupedDataCount:
    label: Optional[str] = dict_key_field()
    area_id: Optional[str] = dict_key_field()
    count: int = dict_key_field()

    @strawberry_django.field
    async def gss_area(self, info: Info) -> Optional[Area]:
        loader = FieldDataLoaderFactory.get_loader_class(models.Area, field="gss")
        return await loader(context=info.context).load(self.get("area_id", None))


@strawberry_django.type(models.GenericData, filters=CommonDataFilter)
class GenericData(CommonData):
    last_update: auto
    id: auto = strawberry_django.field(field_name="data")
    name: auto = attr_field()
    first_name: auto
    last_name: auto
    full_name: auto
    email: auto
    phone: auto
    address: auto
    postcode: auto
    postcode_data: Optional[PostcodesIOResult]


@strawberry.type
class MapReportMemberFeature(PointFeature):
    properties: GenericData


@strawberry_django.type(models.ExternalDataSource, filters=ExternalDataSourceFilter)
class ExternalDataSource:
    id: auto
    name: auto
    data_type: auto
    description: auto
    created_at: auto
    last_update: auto
    organisation: Organisation = strawberry_django_dataloaders.fields.auto_dataloader_field()
    geography_column: auto
    geography_column_type: auto
    postcode_field: auto
    first_name_field: auto
    last_name_field: auto
    full_name_field: auto
    email_field: auto
    phone_field: auto
    address_field: auto
    update_mapping: Optional[List["AutoUpdateConfig"]]
    auto_update_enabled: auto
    auto_import_enabled: auto
    field_definitions: Optional[List[FieldDefinition]] = strawberry_django.field(
        resolver=lambda self: self.field_definitions()
    )
    record_url_template: Optional[str] = fn_field()
    remote_name: Optional[str] = fn_field()
    remote_url: Optional[str] = fn_field()
    healthcheck: bool = fn_field()

    jobs: List[QueueJob] = strawberry_django.field(
        resolver=lambda self: procrastinate.contrib.django.models.ProcrastinateJob.objects.filter(
            args__external_data_source_id=str(self.id)
        ),
        filters=QueueFilter,
        pagination=True,
    )

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        return queryset.filter(organisation__members__user=user.id)

    @strawberry_django.field
    def connection_details(
        self: models.ExternalDataSource, info
    ) -> Union["AirtableSource"]:
        instance = self.get_real_instance()
        return instance

    @strawberry_django.field
    def auto_update_webhook_url(self: models.ExternalDataSource, info) -> str:
        return self.auto_update_webhook_url()

    @strawberry_django.field
    def webhook_healthcheck(self: models.ExternalDataSource, info) -> bool:
        return self.webhook_healthcheck()

    @strawberry_django.field
    def imported_data_geojson_points(
        self: models.ExternalDataSource, info: Info
    ) -> List[MapReportMemberFeature]:
        data = self.get_import_data()
        return [
            MapReportMemberFeature.from_geodjango(
                point=generic_datum.point,
                id=generic_datum.data,
                properties=generic_datum,
            )
            for generic_datum in data
            if generic_datum.point is not None
        ]

    imported_data_count: int = fn_field()
    imported_data_count_by_region: List[GroupedDataCount] = fn_field()
    imported_data_count_by_constituency: List[GroupedDataCount] = fn_field()
    imported_data_count_by_constituency_2024: List[GroupedDataCount] = fn_field()
    imported_data_count_by_council: List[GroupedDataCount] = fn_field()
    imported_data_count_by_ward: List[GroupedDataCount] = fn_field()

    @strawberry_django.field
    def is_importing(self: models.ExternalDataSource, info: Info) -> bool:
        return (
            self.event_log_queryset()
            .filter(status="doing", task_name="hub.tasks.import_all")
            .exists()
        )


@strawberry.type
class AutoUpdateConfig:
    source: str = dict_key_field()
    source_path: str = dict_key_field()
    destination_column: str = dict_key_field()


@strawberry_django.type(models.AirtableSource)
class AirtableSource(ExternalDataSource):
    api_key: auto
    base_id: auto
    table_id: auto


@strawberry_django.type(models.Report)
class Report:
    id: auto
    organisation: auto
    name: auto
    slug: auto
    description: auto
    created_at: auto
    last_update: auto

    @classmethod
    def get_queryset(cls, queryset, info, **kwargs):
        user = get_current_user(info)
        return queryset.filter(organisation__members__user=user.id)


@strawberry.type
class MapLayer:
    name: str = dict_key_field()
    visible: Optional[bool] = dict_key_field()

    @strawberry_django.field
    def source(self, info: Info) -> ExternalDataSource:
        source_id = self.get(info.python_name, None)
        return models.ExternalDataSource.objects.get(id=source_id)


@strawberry_django.type(models.MapReport)
class MapReport(Report):
    layers: List[MapLayer]
    imported_data_count: int = fn_field()
    imported_data_count_by_region: List[GroupedDataCount] = fn_field()
    imported_data_count_by_constituency: List[GroupedDataCount] = fn_field()
    imported_data_count_by_constituency_2024: List[GroupedDataCount] = fn_field()
    imported_data_count_by_council: List[GroupedDataCount] = fn_field()
    imported_data_count_by_ward: List[GroupedDataCount] = fn_field()

@strawberry_django.field()
def area_by_gss(gss: str) -> models.Area:
    return models.Area.objects.get(gss=gss)

@strawberry_django.field()
def dataset_by_name(name: str) -> models.DataSet:
    return models.DataSet.objects\
        .filter(
            # Exclude strawberry.private data sets
            external_data_source=None
        ).get(name=name)