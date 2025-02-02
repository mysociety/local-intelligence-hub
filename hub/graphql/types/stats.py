
from enum import Enum
import logging
from typing import List, Optional
from hub import models
import numpy as np
import strawberry
from utils.py import ensure_list
from django.contrib.gis.db.models import Union as GisUnion
from django.contrib.gis.geos import Polygon
from utils.geo_reference import (
    AnalyticalAreaType,
    area_to_postcode_io_filter,
    lih_to_postcodes_io_key_map,
)
from django.db.models import F, Q
import pandas as pd
logger = logging.getLogger(__name__)
import numexpr as ne
from utils.statistics import attempt_interpret_series_as_float, attempt_interpret_series_as_percentage, check_percentage, check_numeric


@strawberry.type
class AreaTypeFilter:
    lih_area_type: Optional[str] = None
    mapit_area_types: Optional[list[str]] = None

    @property
    def query_filter(self) -> dict[str, str]:
        return self.fk_filter()
    
    def fk_filter(self, field_name = "") -> dict[str, str]:
        filter = {}
        prefix = f"{field_name}__" if field_name else ""
        if self.lih_area_type:
            filter[f"{prefix}area_type__code"] = self.lih_area_type
        if self.mapit_area_types:
            filter[f"{prefix}mapit_type__in"] = self.mapit_area_types
        return filter

# Provides a map from postcodes.io area type to Local Intelligence Hub
# area types, or mapit types if LIH is misaligned.
postcodeIOKeyAreaTypeLookup = {
    AnalyticalAreaType.parliamentary_constituency: AreaTypeFilter(lih_area_type="WMC"),
    AnalyticalAreaType.parliamentary_constituency_2024: AreaTypeFilter(
        lih_area_type="WMC23"
    ),
    AnalyticalAreaType.admin_district: AreaTypeFilter(
        mapit_area_types=["LBO", "UTA", "COI", "LGD", "MTD", "DIS", "NMD"]
    ),
    AnalyticalAreaType.admin_county: AreaTypeFilter(mapit_area_types=["CTY"]),
    AnalyticalAreaType.admin_ward: AreaTypeFilter(lih_area_type="WD23"),
    AnalyticalAreaType.european_electoral_region: AreaTypeFilter(lih_area_type="EER"),
    AnalyticalAreaType.european_electoral_region: AreaTypeFilter(lih_area_type="CTRY"),
    AnalyticalAreaType.msoa: AreaTypeFilter(lih_area_type="MSOA"),
    AnalyticalAreaType.lsoa: AreaTypeFilter(lih_area_type="LSOA"),
    AnalyticalAreaType.output_area: AreaTypeFilter(lih_area_type="OA21"),
}

# enum for OLAP
@strawberry.enum
class AreaQueryMode(Enum):
    POINTS_WITHIN = "POINTS_WITHIN"
    AREA = "AREA"
    AREA_OR_CHILDREN = "AREA_OR_CHILDREN"
    AREA_OR_PARENTS = "AREA_OR_PARENTS"
    # This mode is used to find overlapping areas in the same way the current choropleth API works
    OVERLAPPING = "OVERLAPPING"

@strawberry.input
class MapBounds:
    north: float
    east: float
    south: float
    west: float


@strawberry.enum
class StatisticsReturnShape(Enum):
    Table = "Table"
    Row = "Row"
    Cell = "Cell"


@strawberry.enum
class AggregationOp(Enum):
    Sum = "Sum"
    Mean = "Mean"
    Max = "Max"
    Min = "Min"
    Count = "Count"
    Guess = "Guess"

@strawberry.input
class AggregationDefinition:
    column: str
    operation: AggregationOp

@strawberry.input
class Formula:
    name: str
    definition: str

'''
An API that can handle multiple requests, but performs the same analyses:
- Table: define a groupby and aggregation operation, get a table of results
- Column: define a groupby and aggregation operation, get a table of results with just one column: `count`
- Row: define a groupby, a filter and aggregation operation, get a row of results
- Cell: define a groupby, a filter, a key and aggregation operation, get a single result

Example query:

statistics(
  # Get data specifically about 1 constituency
    area_query_mode=AreaQueryMode.AREA,
    group_by="constituency",
    gss="E1000100",
  # From this source
    source_id="123",
  # Returned as a table
    mode=StatisticsReturnShape.Table
)

# Same again, but about all constituencies in Wales:
statistics(
    area_query_mode=AreaQueryMode.AREA_OR_CHILDREN,
    group_by="constituency",
    gss="W92000004",
    source_id="123",
    mode=StatisticsReturnShape.Table
)

# Same again, but now about only the count of data in each ward in Wales:
statistics(
    area_query_mode=AreaQueryMode.AREA_OR_CHILDREN,
    group_by="ward",
    gss="W92000004",
    source_id="123",
    mode=StatisticsReturnShape.Column,
    return_type=StatisticsReturnValue.Count
)

# Now only give me the count of members in a particular ward
statistics(
    area_query_mode=AreaQueryMode.AREA,
    group_by="ward",
    gss="W92000004",
    source_id="123",
    mode=StatisticsReturnShape.Cell,
    return_type=StatisticsReturnValue.Count,
)

# Now give me the reform, labour, distance between the two in wards in Yorkshire:
statistics(
    area_query_mode=AreaQueryMode.AREA_OR_CHILDREN,
    group_by="ward",
    gss="E1000100",
    source_id="123",
    mode=StatisticsReturnShape.Row,
    return_type=StatisticsReturnValue.Values,
    return_column=["reform", "labour", "distance"],
    group_by_formula=Formula(
      name="distance",
      definition="reform - labour"
    )
)
'''
def statistics(
    # --- Querying + data ---
    # Pick one or more GenericData sets to blend together.
    # they're gonna all be geo-joined for now.
    source_ids: List[str],
    # How to find data
    area_query_mode: Optional[AreaQueryMode] = AreaQueryMode.AREA,
    # Formulas applied to each raw row
    pre_group_by_formulas: Optional[List[Formula]] = None,
    # --- Slice / dice ---
    # Area filter
    gss_codes: Optional[List[str]] = None,
    # BBOX filter (useful for boundary types that are quite small, like OAs or postcodes)
    map_bounds: Optional[MapBounds] = None,
    # --- Roll up ---
    # Group by one or more keys if you fancy.
    # group_by: Optional[str | List[str]] = None,
    group_by_area: Optional[AnalyticalAreaType] = None,
    # How to aggregate the data during rollup
    aggregation_operations: Optional[List[AggregationDefinition]] = AggregationOp.Guess,
    # Formulas applied to the rolled up rows
    post_groupby_formulas: Optional[List[Formula]] = None,
    # TODO: filter for other columns
    # --- 4. Results ---
    # Can return:
    # - a table of columns
    # - a column (`count`)
    # - a row
    # - a single cell
    return_shape: Optional[StatisticsReturnShape] = StatisticsReturnShape.Table,
    # Define what column values to use if StatisticsReturnValue.Values
    return_columns: Optional[List[str]] = None,
    electoral_data: Optional[bool] = False,
):
    # --- Get the required data for the source ---
    qs = models.GenericData.objects.filter(data_type__data_set__external_data_source_id__in=source_ids)
    
    area_type_filter = None
    # if group_by_area:
    #     area_type_filter = postcodeIOKeyAreaTypeLookup[group_by_area]

    if map_bounds:
        # area_type_filter = postcodeIOKeyAreaTypeLookup[group_by_area]
        bbox_coords = (
            (map_bounds.west, map_bounds.north),  # Top left
            (map_bounds.east, map_bounds.north),  # Top right
            (map_bounds.east, map_bounds.south),  # Bottom right
            (map_bounds.west, map_bounds.south),  # Bottom left
            (map_bounds.west, map_bounds.north),  # Back to start to close polygon
        )
        bbox = Polygon(bbox_coords, srid=4326)
        # areas = models.Area.objects.filter(**area_type_filter.query_filter).filter(
        #     point__within=bbox
        # )
        # combined_area = areas.aggregate(union=GisUnion("polygon"))["union"]
        # all geocoded GenericData should have `point` set
        qs = qs.filter(point__within=bbox)

    filters = Q()
    if gss_codes or area_type_filter:
        if gss_codes:
            area_qs = models.Area.objects.filter(gss__in=gss_codes)
            example_area = area_qs.first()
            combined_areas = area_qs.aggregate(union=GisUnion("polygon"))["union"]

        if combined_areas and area_query_mode is AreaQueryMode.POINTS_WITHIN:
            # We filter on area=None so we don't pick up statistical area data
            # since a super-area may have a point within this area, skewing the results
            filters |= Q(point__within=combined_areas.polygon) & Q(area=None)

        if area_query_mode is AreaQueryMode.AREA:
            if combined_areas:
                # Find only data specifically related to this GSS area — not about its children
                filters |= Q(area__gss__in=gss_codes)
            # if area_type_filter:
            #     # Find only data specifically related to this area type
            #     filters |= Q(**area_type_filter.fk_filter("area"))

        elif area_query_mode is AreaQueryMode.AREA_OR_CHILDREN:
            if combined_areas:
                filters |= Q(area__gss__in=gss_codes)
                # Or find GenericData tagged with area that is fully contained by this area's polygon
                postcode_io_key = area_to_postcode_io_filter(example_area)
                if postcode_io_key is None:
                    postcode_io_key = lih_to_postcodes_io_key_map.get(example_area.area_type.code, None)
                if postcode_io_key:
                    subclause = Q()
                    # See if there's a matched postcode data field for this area
                    subclause &= Q(
                        **{f"postcode_data__codes__{postcode_io_key.value}__in": gss_codes}
                    )
                    # And see if the area is SMALLER than the current area — i.e. a child
                    subclause &= Q(area__polygon__within=combined_areas)
                    filters |= subclause
            # if area_type_filter:
            #     filters |= Q(**area_type_filter.fk_filter("area"))

        elif area_query_mode is AreaQueryMode.AREA_OR_PARENTS:
            if combined_areas:
                filters |= Q(area__gss__in=gss_codes)
                # Or find GenericData tagged with area that fully contains this area's polygon
                postcode_io_key = area_to_postcode_io_filter(example_area)
                if postcode_io_key is None:
                    postcode_io_key = lih_to_postcodes_io_key_map.get(example_area.area_type.code, None)
                if postcode_io_key:
                    subclause = Q()
                    # See if there's a matched postcode data field for this area
                    subclause &= Q(
                        **{f"postcode_data__codes__{postcode_io_key.value}__in": gss_codes}
                    )
                    # And see if the area is LARGER than the current area — i.e. a parent
                    subclause &= Q(area__polygon__contains=combined_areas)
                    filters |= subclause
            # if area_type_filter:
            #     filters |= Q(**area_type_filter.fk_filter("area"))

        elif area_query_mode is AreaQueryMode.OVERLAPPING:
            if gss_codes:
                filters |= Q(area__gss__in=gss_codes)
                # Or find GenericData tagged with area that overlaps this area's polygon
                postcode_io_key = area_to_postcode_io_filter(example_area)
                if postcode_io_key is None:
                    postcode_io_key = lih_to_postcodes_io_key_map.get(example_area.area_type.code, None)
                if postcode_io_key:
                    filters |= Q(**{f"postcode_data__codes__{postcode_io_key.value}__in": gss_codes})
            if combined_areas:
                filters |= Q(area__polygon__contains=combined_areas)
            # if area_type_filter:
            #     filters |= Q(**area_type_filter.fk_filter("area"))

    data = qs.filter(filters)

    # --- Load the data in to a pandas dataframe ---
    # TODO: get columns from JSON for returning clean data
    d = [
      {
        **record.json,
        "postcode_data": record.postcode_data,
        "gss": record.area.gss if record.area else None,
        "area_type": record.area.area_type.code if record.area else None,
        "area_name": record.area.name if record.area else None,
        "id": str(record.id),
      }
      for record in data
    ]
  
    df = pd.DataFrame(d)

    if len(df) <= 0:
        logger.debug("No data found for this source")
        return None
    
    df = df.set_index("id", drop=False)

    # Apply the row-level formulas

    if pre_group_by_formulas:
        for formula in pre_group_by_formulas:
            df[formula.name] = df.eval(formula.definition)
            try:
                df[formula.name] = df.eval(formula.definition)
            except ValueError:
                # In case "where" is used, which pandas doesn't support
                # https://github.com/pandas-dev/pandas/issues/34834
                df[formula.name] = ne.evaluate(formula, local_dict=df)

    # --- Group by the groupby keys ---
    # respecting aggregation operations
    percentage_keys = []
    numerical_keys = []
    if group_by_area:
        # Get rid of ID index
        df = df.reset_index(drop=True).drop(columns=["id"])

        def get_group_by_area_properties(row):
            try:
                return [
                    row["postcode_data"].get("codes", {}).get(group_by_area.value, None),
                    row["postcode_data"].get(group_by_area.value, None)
                ]
            except KeyError:
                pass
        
        # First, add labels for the group_by_area as an index
        df["gss"], df["area_name"] = zip(*df.apply(get_group_by_area_properties, axis=1))
        # Make the code an index
        # df = df.set_index("group_by_code")

        # Narrow down the DF to just the numerical columns then
        for column in df:
            if all(df[column].apply(check_percentage)):
                percentage_keys += [str(column)]
                df[column] = attempt_interpret_series_as_percentage(df[column])
            elif all(df[column].apply(check_numeric)):
                df[column] = attempt_interpret_series_as_float(df[column])
        numerical_keys = df.select_dtypes(include="number").columns
        # # remove columns that aren't numerical_keys
        # df = df[numerical_keys]


        # Collect the mode of the string columns
        # strings = df.select_dtypes(include="object")
        def get_mode(series):
            try:
                return series.mode()[0]
            except KeyError:
                return None
        df_mode = df[["area_name", "gss"]].groupby("gss").agg(get_mode)
        print("df_mode", df_mode.index)

        # Aggregate the numerical columns
        df_stats = df[numerical_keys.tolist() + ["gss"]].set_index("gss")
        print("df_stats", df_stats.index)
        if aggregation_operations:
            agg_config = dict()
            for key in numerical_keys.tolist():
                agg_config[key] = "sum"
                for op in aggregation_operations:
                    if op.column == key:
                        agg_config[key] = op.operation.value.lower()
                        break
        else:
            agg_config = "sum"
        print(agg_config)
        df_aggregated = df_stats.groupby("gss").agg(agg_config)
        print("df_aggregated", df_aggregated.index)

        # Merge the strings and the numericals back together
        df = df_mode.join(df_aggregated, on="gss", how="left")

    # Apply the groupby formulas
    if post_groupby_formulas:
        for formula in post_groupby_formulas:
            df[formula.name] = df.eval(formula.definition)
            try:
                df[formula.name] = df.eval(formula.definition)
            except ValueError:
                # In case "where" is used, which pandas doesn't support
                # https://github.com/pandas-dev/pandas/issues/34834
                df[formula.name] = ne.evaluate(formula, local_dict=df)

    if electoral_data:
        # TODO: `zero-size array to reduction operation maximum which has no identity`
        values = df[numerical_keys].values
        df["first"] = values.max(axis=1),
        df["second"] = np.partition(values, -2, axis=1)[:, -2],
        df["majority"] = values.max(axis=1) - np.partition(values, -2, axis=1)[:, -2],
        df["third"] = np.partition(values, -3, axis=1)[:, -3],
        df["last"] = values.min(axis=1),
        df["total"] = df[numerical_keys].sum(axis=1),

    # Return the results in the requested format
    # if return_shape is StatisticsReturnShape.Table:
    if return_columns and len(return_columns) > 0:
        if group_by_area:
            df = df.reset_index(drop=False)
        return df[return_columns].to_dict(orient="records")
    return df.to_dict(orient="records")

    # elif return_shape is StatisticsReturnShape.Row:
    #     if gss_codes is None:
    #         raise ValueError("`gss_codes` must be specified when returning a row")
    #     return df.loc[df["gss"] == gss_codes].to_dict(orient="index")

    # elif return_shape is StatisticsReturnShape.Cell:
    #     if gss_codes is None or return_columns is None or len(return_columns) <= 0:
    #         raise ValueError("`gss` and `return_column` must be specified when returning a cell")
    #     return df.loc[df["gss"] == gss_codes, return_columns].iloc[0]