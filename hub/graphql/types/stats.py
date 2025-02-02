
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
from utils.statistics import attempt_interpret_series_as_float, attempt_interpret_series_as_percentage, check_percentage, check_numeric, get_mode


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
class CalculatedColumn:
    name: str
    expression: str
    aggregation_operation: Optional[AggregationOp] = None

@strawberry.input
class GroupByColumn:
    name: Optional[str] = None
    column: str
    aggregation_operation: Optional[AggregationOp] = None

'''
# Some examples of use

Show me the number of reform votes in each area, grouped by reform votes
modelling swing from conservative and lab to reform:

query SwingToReformByRegion {
  statistics(
    # gssCodes:"E15000005",
    areaQueryMode: AREA_OR_CHILDREN,
    # groupByArea: european_electoral_region,
    groupByColumns: [
      {
        column: "reform",
        aggregationOperation: "count"
      }
    ]
    sourceIds: [
      "5336849b-dea5-43cd-b973-dc507e5301af",
      # "711400aa-f9c7-439f-9912-2dbe64c3c1cd"
  	]
    preGroupByCalculatedColumns: [
      {
        name: "conservative",
        expression: "conservative - 0.03"
        aggregationOperation: Mean
      },
      {
        name: "labour",
        expression: "labour - 0.03"
        aggregationOperation: Mean
      },
      {
        name: "reform",
        expression: "reform + 0.06"
        aggregationOperation: Mean
      }
    ]
    calculatedColumns:[{
    	name:"ref_marginality",
      expression:"reform / second"
      # expression:"first"
      # expression:"reform / labour"
    }]
    returnColumns: [
      "first_label",
      "second_label",
      "first",
      "second",
      # "labour",
      "majority",
      # "reform_swing"
      "area_name",
      "area_type",
      "gss"]
    # aggregationOperation: Mean
  )
}
'''
def statistics(
    # --- Querying + data ---
    # Pick one or more GenericData sets to blend together.
    # they're gonna all be geo-joined for now.
    source_ids: List[str],
    # How to find data
    area_query_mode: Optional[AreaQueryMode] = AreaQueryMode.AREA,
    # CalculatedColumns applied to each raw row
    pre_group_by_calculated_columns: Optional[List[CalculatedColumn]] = None,
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
    aggregation_operation: Optional[AggregationOp] = AggregationOp.Sum,
    aggregation_operations: Optional[List[AggregationDefinition]] = None,
    # CalculatedColumns applied to the rolled up rows
    calculated_columns: Optional[List[CalculatedColumn]] = None,
    # TODO: filter for other columns
    group_by_columns: Optional[List[GroupByColumn]] = None,
    # --- 4. Results ---
    # Define what column values to use if StatisticsReturnValue.Values
    return_columns: Optional[List[str]] = None,
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

    # Format numerics
    percentage_keys = []
    numerical_keys = []
    for column in df:
        if column != "id":
            if all(df[column].apply(check_percentage)):
                df[column] = attempt_interpret_series_as_percentage(df[column])
                percentage_keys += [str(column)]
            elif all(df[column].apply(check_numeric)):
                df[column] = attempt_interpret_series_as_float(df[column])
                numerical_keys += [str(column)]
    # Narrow down the DF to just the numerical columns then
    numerical_keys = df.select_dtypes(include="number").columns.tolist()
    # Exclude "id" from the numerical keys
    if "id" in numerical_keys:
        numerical_keys = numerical_keys.drop("id")

    # Apply the row-level cols
    if pre_group_by_calculated_columns:
        for col in pre_group_by_calculated_columns:
            df[col.name] = df.eval(col.expression)
            try:
                df[col.name] = df.eval(col.expression)
            except ValueError:
                # In case "where" is used, which pandas doesn't support
                # https://github.com/pandas-dev/pandas/issues/34834
                df[col.name] = ne.evaluate(col, local_dict=df)
            if col.name not in numerical_keys:
                numerical_keys += [col.name]

    # --- Group by the groupby keys ---
    # respecting aggregation operations
    if group_by_area:
        # Get rid of ID index
        df = df.reset_index(drop=True).drop(columns=["id"])

        def get_group_by_area_properties(row):
            # Find the key of `lih_to_postcodes_io_key_map` where the value is `group_by_area`:
            area_type = next((k for k, v in lih_to_postcodes_io_key_map.items() if v == group_by_area), None)

            try:
                return [
                    row["postcode_data"].get("codes", {}).get(group_by_area.value, None),
                    row["postcode_data"].get(group_by_area.value, None),
                    area_type
                ]
            except KeyError:
                pass
        
        # First, add labels for the group_by_area as an index
        df["gss"], df["area_name"], df["area_type"] = zip(*df.apply(get_group_by_area_properties, axis=1))
        # Make the code an index
        # df = df.set_index("group_by_code")

        # # remove columns that aren't numerical_keys
        # df = df[numerical_keys]

        # Collect the mode of the string columns
        # strings = df.select_dtypes(include="object"
        df_mode = df[["area_name", "gss", "area_type"]].groupby("gss").agg(get_mode)

        # Aggregate the numerical columns
        df_stats = df[numerical_keys + ["gss"]].set_index("gss")
        agg_config = dict()
        if aggregation_operations and len(aggregation_operations) > 0:
            # Per-key config
            for key in numerical_keys:
                if key in percentage_keys:
                    agg_config[key] = "mean"
                else:
                    agg_config[key] = "sum"
                for op in aggregation_operations:
                    if op.column == key:
                        agg_config[key] = op.operation.value.lower()
                        break
        else:
            # Guess
            for key in numerical_keys:
                calculated_column = next(
                    (col for col in pre_group_by_calculated_columns if col.name == key),
                    None
                ) if pre_group_by_calculated_columns and len(pre_group_by_calculated_columns) > 0 else None
                if aggregation_operation and aggregation_operation is not AggregationOp.Guess:
                    agg_config[key] = aggregation_operation.value.lower()
                elif calculated_column and calculated_column.aggregation_operation and calculated_column.aggregation_operation is not AggregationOp.Guess:
                    agg_config[key] = calculated_column.aggregation_operation.value.lower()
                elif key in percentage_keys:
                    agg_config[key] = "mean"
                else:
                    agg_config[key] = "sum"
        df_aggregated = df_stats.groupby("gss").agg(agg_config)

        # Merge the strings and the numericals back together
        df = df_mode.join(df_aggregated, on="gss", how="left")

    if len(numerical_keys) > 0:
        # Provide some special variables to the col editor
        values = df[numerical_keys].values
        df["first"] = values.max(axis=1)
        # column name of "first"
        df["first_label"] = df[numerical_keys].idxmax(axis=1)
        try:
            df["second"] = np.partition(values, -2, axis=1)[:, -2]
            # df["second_label"] = # TODO: get the column name of the second highst value
            # df["second_label"] = df[numerical_keys].apply(lambda x: x.nlargest(2).index[-1], axis=1)
            # As above, but using numpy not pandas
            df["second_label"] = df[numerical_keys].columns[df[numerical_keys].values.argsort()[:, -2]]
            df["majority"] = df["first"] - df["second"]
        except IndexError:
            pass
        try:
            df["third"] = np.partition(values, -3, axis=1)[:, -3]
        except IndexError:
            pass
        df["total"] = values.sum(axis=1)

        # Apply formulas
        if calculated_columns and len(calculated_columns) > 0:
            for col in calculated_columns:
                print(col)
                df[col.name] = df.eval(col.expression)
                try:
                    df[col.name] = df.eval(col.expression)
                except ValueError:
                    # In case "where" is used, which pandas doesn't support
                    # https://github.com/pandas-dev/pandas/issues/34834
                    df[col.name] = ne.evaluate(col, local_dict=df)
                if col.name not in numerical_keys:
                    numerical_keys += [col.name]

            # Then recalculate based on the formula, since they may've doctored the values.
            values = df[numerical_keys].values
            df["first"] = values.max(axis=1)
            # column name of "first"
            df["first_label"] = df[numerical_keys].idxmax(axis=1)
            try:
                df["second"] = np.partition(values, -2, axis=1)[:, -2]
                # df["second_label"] = # TODO: get the column name of the second highst value
                # df["second_label"] = df[numerical_keys].apply(lambda x: x.nlargest(2).index[-1], axis=1)
                # As above, but using numpy not pandas
                df["second_label"] = df[numerical_keys].columns[df[numerical_keys].values.argsort()[:, -2]]
                df["majority"] = df["first"] - df["second"]
            except IndexError:
                pass
            try:
                df["third"] = np.partition(values, -3, axis=1)[:, -3]
            except IndexError:
                pass
            df["total"] = values.sum(axis=1)

    # Final grouping
    if group_by_columns and len(group_by_columns) > 0:
        agg_config = dict()
        for col in group_by_columns:
            name = col.name or col.column
            agg_config.update(**{
                name: pd.NamedAgg(column=col.column, aggfunc=get_mode),
                f"{name}_{col.aggregation_operation.value.lower()}": pd.NamedAgg(column=col.column, aggfunc=col.aggregation_operation.value.lower() if col.aggregation_operation and col.aggregation_operation is not AggregationOp.Guess else "sum"),
            })
        df = df.groupby(col.column, as_index=False).agg(**agg_config)
        return df.to_dict(orient="records")
    else:
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