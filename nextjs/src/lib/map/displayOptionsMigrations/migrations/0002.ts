import {
  AggregationDefinition,
  AggregationOp,
  AnalyticalAreaType,
  AreaQueryMode,
  CalculatedColumn,
  DataSourceType,
  GetMapReportQuery,
  GroupByColumn,
  InputMaybe,
} from '@/__generated__/graphql'
import { StatisticsConfigSchema } from '@/__generated__/zodSchema'
import { BoundaryType } from '@/app/reports/[id]/politicalTilesets'
import {
  DataDisplayMode,
  DisplayOptionsVersion,
  ElectionSystem,
  Palette,
  StatisticalDataType,
  StatisticsMode,
  TableGroupByMode,
  ViewType,
} from '@/app/reports/[id]/reportContext'
import { InspectorDisplayType } from '@/lib/explorer'
import { produce } from 'immer'
import { DeepUnion } from 'typescript-migration'
import { v4 } from 'uuid'

export const NEXT_VERSION = DisplayOptionsVersion['2025-02-08']

/**
 * Move dataVisualisation and display to views[0].mapOptions.
 */
export function upgrade20250125to20250208(original: BaseVersion): AnyVersion {
  return produce(original, (draft: NextVersion) => {
    draft.displayOptions.version = NEXT_VERSION

    for (const viewId of Object.keys(draft.displayOptions.views)) {
      if (
        original.displayOptions.views[viewId].type === ViewType.Map &&
        draft.displayOptions.views[viewId].type === ViewType.Map
      ) {
        if (
          !original.displayOptions.views[viewId].mapOptions.choropleth
            .advancedStatisticsConfig
        ) {
          draft.displayOptions.views[
            viewId
          ].mapOptions.choropleth.advancedStatisticsConfig =
            StatisticsConfigSchema().parse({})
        }
        if (
          !original.displayOptions.views[viewId].mapOptions.choropleth
            .useAdvancedStatistics
        ) {
          // Migrate sourceId
          const sourceId =
            draft.layers.find(
              (l) =>
                original.displayOptions.views[viewId].type === ViewType.Map &&
                l.id ===
                  original.displayOptions.views[viewId]?.mapOptions.choropleth
                    .layerId
            )?.source ||
            original.displayOptions.views[viewId]?.mapOptions.choropleth
              .advancedStatisticsConfig?.sourceIds?.[0] ||
            // pick the first source from the report
            draft.layers.find((l) => l.source)?.source
          delete (
            draft.displayOptions.views[viewId]
              .mapOptions as unknown as BaseVersionMapOptions
          ).choropleth.layerId
          if (sourceId) {
            draft.displayOptions.views[
              viewId
            ].mapOptions.choropleth.advancedStatisticsConfig = {
              ...original.displayOptions.views[viewId].mapOptions.choropleth
                .advancedStatisticsConfig,
              sourceIds: [sourceId],
            }
            // Migrate configs
            if (
              original.displayOptions.views[viewId].mapOptions.choropleth
                .mode === 'Count'
            ) {
              draft.displayOptions.views[
                viewId
              ].mapOptions.choropleth.advancedStatisticsConfig.aggregationOperation =
                AggregationOp.Count
            } else if (
              original.displayOptions.views[viewId].mapOptions.choropleth
                .mode === 'Formula' &&
              original.displayOptions.views[viewId].mapOptions.choropleth
                .formula
            ) {
              draft.displayOptions.views[
                viewId
              ].mapOptions.choropleth.advancedStatisticsConfig.calculatedColumns =
                [
                  {
                    id: v4(),
                    name: 'simple_formula',
                    expression:
                      original.displayOptions.views[viewId].mapOptions
                        .choropleth.formula,
                  },
                ]
            }
          }
        } else if (
          original.displayOptions.views[viewId].mapOptions.choropleth
            .useAdvancedStatistics &&
          original.displayOptions.views[viewId].mapOptions.choropleth
            .advancedStatisticsConfig
        ) {
          delete (
            draft.displayOptions.views[viewId]
              .mapOptions as unknown as BaseVersionMapOptions
          ).choropleth.useAdvancedStatistics
          if (
            original.displayOptions.views[viewId].mapOptions.choropleth
              .advancedStatisticsDisplayField
          ) {
            draft.displayOptions.views[viewId].mapOptions.choropleth.field =
              original.displayOptions.views[
                viewId
              ].mapOptions.choropleth.advancedStatisticsDisplayField
            delete (
              draft.displayOptions.views[viewId]
                .mapOptions as unknown as BaseVersionMapOptions
            ).choropleth.advancedStatisticsDisplayField
          }
          if (
            original.displayOptions.views[viewId].mapOptions.choropleth
              .advancedStatisticsDisplayFieldIsPercentage
          ) {
            draft.displayOptions.views[
              viewId
            ].mapOptions.choropleth.fieldIsPercentage =
              original.displayOptions.views[
                viewId
              ].mapOptions.choropleth.advancedStatisticsDisplayFieldIsPercentage
            delete (
              draft.displayOptions.views[viewId]
                .mapOptions as unknown as BaseVersionMapOptions
            ).choropleth.advancedStatisticsDisplayFieldIsPercentage
          }
        }
        // Swap mode to StatisticsMode, factoring in any advanced statistics config
        if (
          // multiple calculations
          (
            draft.displayOptions.views[viewId].mapOptions.choropleth
              .advancedStatisticsConfig.preGroupByCalculatedColumns || []
          ).concat(
            draft.displayOptions.views[viewId].mapOptions.choropleth
              .advancedStatisticsConfig.calculatedColumns || []
          ).length > 1 ||
          // multiple agg ops
          (
            draft.displayOptions.views[viewId].mapOptions.choropleth
              .advancedStatisticsConfig.aggregationOperations || []
          ).length ||
          // any group bys
          !!draft.displayOptions.views[viewId].mapOptions.choropleth
            .advancedStatisticsConfig.groupByArea ||
          !!draft.displayOptions.views[viewId].mapOptions.choropleth
            .advancedStatisticsConfig.groupAbsolutely ||
          (
            draft.displayOptions.views[viewId].mapOptions.choropleth
              .advancedStatisticsConfig.groupByColumns || []
          ).length > 0
        ) {
          draft.displayOptions.views[viewId].mapOptions.choropleth.mode =
            StatisticsMode.Advanced
        } else if (
          (
            draft.displayOptions.views[viewId].mapOptions.choropleth
              .advancedStatisticsConfig.preGroupByCalculatedColumns || []
          ).concat(
            draft.displayOptions.views[viewId].mapOptions.choropleth
              .advancedStatisticsConfig.calculatedColumns || []
          ).length === 1 ||
          original.displayOptions.views[viewId].mapOptions.choropleth.mode ===
            'Formula'
        ) {
          draft.displayOptions.views[viewId].mapOptions.choropleth.mode =
            StatisticsMode.Formula
          delete draft.displayOptions.views[viewId].mapOptions.choropleth
            .advancedStatisticsConfig.aggregationOperation
        } else if (
          draft.displayOptions.views[viewId].mapOptions.choropleth.field &&
          original.displayOptions.views[viewId].mapOptions.choropleth.mode ===
            'Field'
        ) {
          draft.displayOptions.views[viewId].mapOptions.choropleth.mode =
            StatisticsMode.Field
          delete draft.displayOptions.views[viewId].mapOptions.choropleth
            .advancedStatisticsConfig.aggregationOperation
        } else {
          draft.displayOptions.views[viewId].mapOptions.choropleth.mode =
            StatisticsMode.Count
          draft.displayOptions.views[
            viewId
          ].mapOptions.choropleth.advancedStatisticsConfig.aggregationOperation =
            AggregationOp.Count
        }
      }
    }
  })
}

type BaseVersionMapOptions = {
  choropleth: {
    boundaryType: BoundaryType
    palette: Palette
    mode: 'Count' | 'Formula' | 'Field'
    dataType: StatisticalDataType
    isPaletteReversed?: boolean | undefined
    layerId?: string | undefined
    field?: string | undefined
    formula?: string | undefined
    useAdvancedStatistics?: boolean | undefined
    advancedStatisticsConfig?:
      | {
          sourceIds: string[]
          preGroupByCalculatedColumns?:
            | InputMaybe<CalculatedColumn[]>
            | undefined
          aggregationOperation?: InputMaybe<AggregationOp> | undefined
          aggregationOperations?:
            | InputMaybe<AggregationDefinition[]>
            | undefined
          areaQueryMode?: InputMaybe<AreaQueryMode> | undefined
          calculatedColumns?: InputMaybe<CalculatedColumn[]> | undefined
          excludeColumns?: InputMaybe<string[]> | undefined
          formatNumericKeys?: InputMaybe<boolean> | undefined
          groupAbsolutely?: InputMaybe<boolean> | undefined
          groupByArea?: InputMaybe<AnalyticalAreaType> | undefined
          groupByColumns?: InputMaybe<GroupByColumn[]> | undefined
          gssCodes?: InputMaybe<string[]> | undefined
          returnColumns?: InputMaybe<string[]> | undefined
        }
      | undefined
    isElectoral?: boolean | undefined
    advancedStatisticsDisplayField?: string | undefined
    advancedStatisticsDisplayFieldIsPercentage?: boolean | undefined
  }
  layers: Record<
    string,
    {
      id: string
      layerId: string
      visible: boolean
      name?: string | undefined
      colour?: string | undefined
      circleRadius?: number | undefined
      minZoom?: number | undefined
      markerSize?: number | undefined
    }
  >
  display: {
    choropleth: boolean
    borders: boolean
    choroplethValueLabels: boolean
    boundaryNames: boolean
    streetDetails?: boolean | undefined
  }
}

type BaseVersion = Omit<GetMapReportQuery['mapReport'], 'displayOptions'> & {
  displayOptions: {
    version: string
    starred: Record<
      string,
      {
        id: string
        entity: '' | 'area' | 'record'
        showExplorer: boolean
        name?: string | undefined
        icon?: DataSourceType | undefined
      }
    >
    areaExplorer: {
      displays: Record<
        string,
        {
          id: string
          layerId: string
          areaQueryMode: AreaQueryMode
          displayType: InspectorDisplayType
          name?: string | undefined
          useAdvancedStatistics?: boolean | undefined
          advancedStatisticsConfig?:
            | {
                sourceIds: string[]
                preGroupByCalculatedColumns?:
                  | InputMaybe<CalculatedColumn[]>
                  | undefined
                aggregationOperation?: InputMaybe<AggregationOp> | undefined
                aggregationOperations?:
                  | InputMaybe<AggregationDefinition[]>
                  | undefined
                areaQueryMode?: InputMaybe<AreaQueryMode> | undefined
                calculatedColumns?: InputMaybe<CalculatedColumn[]> | undefined
                excludeColumns?: InputMaybe<string[]> | undefined
                formatNumericKeys?: InputMaybe<boolean> | undefined
                groupAbsolutely?: InputMaybe<boolean> | undefined
                groupByArea?: InputMaybe<AnalyticalAreaType> | undefined
                groupByColumns?: InputMaybe<GroupByColumn[]> | undefined
                gssCodes?: InputMaybe<string[]> | undefined
                returnColumns?: InputMaybe<string[]> | undefined
              }
            | undefined
          isElectoral?: boolean | undefined
          dataDisplayMode?: DataDisplayMode | undefined
          dataSourceType?: DataSourceType | undefined
          bigNumberField?: string | undefined
          bigNumberFields?: string[] | undefined
          isPercentage?: boolean | undefined
          electionSystem?: ElectionSystem | undefined
          appendChoroplethStatistics?: boolean | undefined
          hideTitle?: boolean | undefined
        }
      >
      displaySortOrder: string[]
    }
    recordExplorer: {
      includeProperties?: string[] | undefined
    }
    views: Record<
      string,
      | {
          mapOptions: BaseVersionMapOptions
          id: string
          type: ViewType.Map
          name?: string | undefined
          description?: string | undefined
          icon?: string | undefined
          colour?: string | undefined
        }
      | {
          id: string
          type: ViewType.Table
          tableOptions: {
            sorting: {
              id: string
              desc: boolean
            }[]
            groupBy: {
              area: AnalyticalAreaType
              mode: TableGroupByMode
            }
            layerId?: string | undefined
          }
          name?: string | undefined
          description?: string | undefined
          icon?: string | undefined
          colour?: string | undefined
        }
    >
    viewSortOrder: string[]
  }
}

type NextVersion = Omit<GetMapReportQuery['mapReport'], 'displayOptions'> & {
  displayOptions: {
    version: string
    starred: Record<
      string,
      {
        id: string
        entity: '' | 'area' | 'record'
        showExplorer: boolean
        name?: string | undefined
        icon?: DataSourceType | undefined
      }
    >
    areaExplorer: {
      displays: Record<
        string,
        {
          id: string
          areaQueryMode: AreaQueryMode
          layerId: string
          displayType: InspectorDisplayType
          name?: string | undefined
          advancedStatisticsConfig?:
            | {
                aggregationOperation?: InputMaybe<AggregationOp> | undefined
                aggregationOperations?:
                  | InputMaybe<AggregationDefinition[]>
                  | undefined
                areaQueryMode?: InputMaybe<AreaQueryMode> | undefined
                calculatedColumns?: InputMaybe<CalculatedColumn[]> | undefined
                excludeColumns?: InputMaybe<string[]> | undefined
                formatNumericKeys?: InputMaybe<boolean> | undefined
                groupAbsolutely?: InputMaybe<boolean> | undefined
                groupByArea?: InputMaybe<AnalyticalAreaType> | undefined
                groupByColumns?: InputMaybe<GroupByColumn[]> | undefined
                gssCodes?: InputMaybe<string[]> | undefined
                preGroupByCalculatedColumns?:
                  | InputMaybe<CalculatedColumn[]>
                  | undefined
                returnColumns?: InputMaybe<string[]> | undefined
                sourceIds?: InputMaybe<string[]> | undefined
              }
            | undefined
          isElectoral?: boolean | undefined
          dataDisplayMode?: DataDisplayMode | undefined
          dataSourceType?: DataSourceType | undefined
          bigNumberField?: string | undefined
          bigNumberFields?: string[] | undefined
          isPercentage?: boolean | undefined
          electionSystem?: ElectionSystem | undefined
          appendChoroplethStatistics?: boolean | undefined
          useAdvancedStatistics?: boolean | undefined
          hideTitle?: boolean | undefined
        }
      >
      displaySortOrder: string[]
    }
    recordExplorer: {
      includeProperties?: string[] | undefined
    }
    views: Record<
      string,
      | {
          id: string
          type: ViewType.Map
          mapOptions: {
            layers: Record<
              string,
              {
                id: string
                layerId: string
                visible: boolean
                name?: string | undefined
                colour?: string | undefined
                circleRadius?: number | undefined
                minZoom?: number | undefined
                markerSize?: number | undefined
              }
            >
            display: {
              choropleth: boolean
              borders: boolean
              choroplethValueLabels: boolean
              boundaryNames: boolean
              streetDetails?: boolean | undefined
            }
            choropleth: {
              mode: StatisticsMode
              boundaryType: BoundaryType
              palette: Palette
              advancedStatisticsConfig: {
                aggregationOperation?: InputMaybe<AggregationOp> | undefined
                aggregationOperations?:
                  | InputMaybe<AggregationDefinition[]>
                  | undefined
                areaQueryMode?: InputMaybe<AreaQueryMode> | undefined
                calculatedColumns?: InputMaybe<CalculatedColumn[]> | undefined
                excludeColumns?: InputMaybe<string[]> | undefined
                formatNumericKeys?: InputMaybe<boolean> | undefined
                groupAbsolutely?: InputMaybe<boolean> | undefined
                groupByArea?: InputMaybe<AnalyticalAreaType> | undefined
                groupByColumns?: InputMaybe<GroupByColumn[]> | undefined
                gssCodes?: InputMaybe<string[]> | undefined
                preGroupByCalculatedColumns?:
                  | InputMaybe<CalculatedColumn[]>
                  | undefined
                returnColumns?: InputMaybe<string[]> | undefined
                sourceIds?: InputMaybe<string[]> | undefined
              }
              dataType: StatisticalDataType
              isPaletteReversed?: boolean | undefined
              field?: string | undefined
              isElectoral?: boolean | undefined
              fieldIsPercentage?: boolean | undefined
            }
          }
          name?: string | undefined
          icon?: string | undefined
          description?: string | undefined
          colour?: string | undefined
        }
      | {
          id: string
          type: ViewType.Table
          tableOptions: {
            sorting: {
              id: string
              desc: boolean
            }[]
            groupBy: {
              area: AnalyticalAreaType
              mode: TableGroupByMode
            }
            layerId?: string | undefined
          }
          name?: string | undefined
          icon?: string | undefined
          description?: string | undefined
          colour?: string | undefined
        }
    >
    viewSortOrder: string[]
  }
}

type MigrationType = DeepUnion<BaseVersion, NextVersion>

interface Version {
  '20250125': BaseVersion
  '2025-01-25': BaseVersion
  '2025-02-08': NextVersion
}

type AnyVersion = BaseVersion | NextVersion
type LatestVersion = NextVersion

// type predicate based on version number
function isVersion<T extends keyof Version>(
  report: AnyVersion,
  version: T
): report is Version[T] {
  return report.displayOptions.version === version
}

// upgrade to the latest version
export default function migration(report: AnyVersion): LatestVersion {
  if (isVersion(report, '2025-02-08')) return report
  else if (isVersion(report, '2025-01-25'))
    return migration(upgrade20250125to20250208(report))
  else if (isVersion(report, '20250125'))
    return migration(upgrade20250125to20250208(report))

  // if not version 1 then it's version 2
  throw new Error(
    'Config cannot be upgraded to current version, please add new upgrade utility.'
  )
}
