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
export function upgrade20250125to20250208(original: BaseVersion): NextVersion {
  return produce(original, (draft: NextVersion) => {
    draft.displayOptions.version = NEXT_VERSION

    for (const viewId of Object.keys(draft.displayOptions.views)) {
      if (
        original.displayOptions.views[viewId].type === ViewType.Map &&
        draft.displayOptions.views[viewId].type === ViewType.Map &&
        'mapOptions' in original.displayOptions.views[viewId]
      ) {
        // @ts-ignore - nextjs build doesn't like these types
        draft.displayOptions.views[viewId].mapOptions = produce(
          // @ts-ignore - nextjs build doesn't like these types
          draft.displayOptions.views[viewId].mapOptions,
          (draftMapOptions: NextMapOptions) => {
            const ogMapOptions =
              draftMapOptions as unknown as BaseVersionMapOptions
            if (!draftMapOptions.choropleth.advancedStatisticsConfig) {
              draftMapOptions.choropleth.advancedStatisticsConfig =
                StatisticsConfigSchema().parse({})
            }
            if (
              // @ts-ignore
              !draftMapOptions.choropleth.useAdvancedStatistics
            ) {
              // Migrate sourceId
              const sourceId =
                draft.layers.find((l) => ogMapOptions.choropleth.layerId)
                  ?.source ||
                ogMapOptions.choropleth.advancedStatisticsConfig
                  ?.sourceIds?.[0] ||
                // pick the first source from the report
                draft.layers.find((l) => l.source)?.source
              delete (draftMapOptions as unknown as BaseVersionMapOptions)
                .choropleth.layerId
              if (sourceId) {
                draftMapOptions.choropleth.advancedStatisticsConfig = {
                  ...draftMapOptions.choropleth.advancedStatisticsConfig,
                  sourceIds: [sourceId],
                }
                // Migrate configs
                if (draftMapOptions.choropleth.mode === 'Count') {
                  draftMapOptions.choropleth.advancedStatisticsConfig.aggregationOperation =
                    AggregationOp.Count
                } else if (
                  ogMapOptions.choropleth.mode === 'Formula' &&
                  ogMapOptions.choropleth.formula
                ) {
                  draftMapOptions.choropleth.advancedStatisticsConfig.calculatedColumns =
                    [
                      {
                        id: v4(),
                        name: 'simple_formula',
                        expression: ogMapOptions.choropleth.formula,
                      },
                    ]
                }
              }
            } else if (
              ogMapOptions.choropleth.useAdvancedStatistics &&
              ogMapOptions.choropleth.advancedStatisticsConfig
            ) {
              delete (draftMapOptions as unknown as BaseVersionMapOptions)
                .choropleth.useAdvancedStatistics
              if (ogMapOptions.choropleth.advancedStatisticsDisplayField) {
                draftMapOptions.choropleth.field =
                  ogMapOptions.choropleth.advancedStatisticsDisplayField
                delete (draftMapOptions as unknown as BaseVersionMapOptions)
                  .choropleth.advancedStatisticsDisplayField
              }
              if (
                ogMapOptions.choropleth
                  .advancedStatisticsDisplayFieldIsPercentage
              ) {
                draftMapOptions.choropleth.fieldIsPercentage =
                  ogMapOptions.choropleth.advancedStatisticsDisplayFieldIsPercentage
                delete (draftMapOptions as unknown as BaseVersionMapOptions)
                  .choropleth.advancedStatisticsDisplayFieldIsPercentage
              }
            }
            // Swap mode to StatisticsMode, factoring in any advanced statistics config
            if (
              // multiple calculations
              (
                draftMapOptions.choropleth.advancedStatisticsConfig
                  .preGroupByCalculatedColumns || []
              ).concat(
                draftMapOptions.choropleth.advancedStatisticsConfig
                  .calculatedColumns || []
              ).length > 1 ||
              // multiple agg ops
              (
                draftMapOptions.choropleth.advancedStatisticsConfig
                  .aggregationOperations || []
              ).length ||
              // any group bys
              !!draftMapOptions.choropleth.advancedStatisticsConfig
                .groupByArea ||
              !!draftMapOptions.choropleth.advancedStatisticsConfig
                .groupAbsolutely ||
              (
                draftMapOptions.choropleth.advancedStatisticsConfig
                  .groupByColumns || []
              ).length > 0
            ) {
              draftMapOptions.choropleth.mode = StatisticsMode.Advanced
            } else if (
              (
                draftMapOptions.choropleth.advancedStatisticsConfig
                  .preGroupByCalculatedColumns || []
              ).concat(
                draftMapOptions.choropleth.advancedStatisticsConfig
                  .calculatedColumns || []
              ).length === 1 ||
              draftMapOptions.choropleth.mode === 'Formula'
            ) {
              draftMapOptions.choropleth.mode = StatisticsMode.Formula
              delete draftMapOptions.choropleth.advancedStatisticsConfig
                .aggregationOperation
            } else if (
              draftMapOptions.choropleth.field &&
              draftMapOptions.choropleth.mode === 'Field'
            ) {
              draftMapOptions.choropleth.mode = StatisticsMode.Field
              delete draftMapOptions.choropleth.advancedStatisticsConfig
                .aggregationOperation
            } else {
              draftMapOptions.choropleth.mode = StatisticsMode.Count
              draftMapOptions.choropleth.advancedStatisticsConfig.aggregationOperation =
                AggregationOp.Count
            }
          }
        )
      }
    }
  }) as NextVersion
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

type NextMapOptions = {
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
      aggregationOperations?: InputMaybe<AggregationDefinition[]> | undefined
      areaQueryMode?: InputMaybe<AreaQueryMode> | undefined
      calculatedColumns?: InputMaybe<CalculatedColumn[]> | undefined
      excludeColumns?: InputMaybe<string[]> | undefined
      formatNumericKeys?: InputMaybe<boolean> | undefined
      groupAbsolutely?: InputMaybe<boolean> | undefined
      groupByArea?: InputMaybe<AnalyticalAreaType> | undefined
      groupByColumns?: InputMaybe<GroupByColumn[]> | undefined
      gssCodes?: InputMaybe<string[]> | undefined
      preGroupByCalculatedColumns?: InputMaybe<CalculatedColumn[]> | undefined
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
          mapOptions: NextMapOptions
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
