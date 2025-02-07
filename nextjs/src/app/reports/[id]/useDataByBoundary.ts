import {
  ChoroplethMode,
  SourceStatsByBoundaryQuery,
  SourceStatsByBoundaryQueryVariables,
  StatisticsQuery,
  StatisticsQueryVariables,
} from '@/__generated__/graphql'
import { useReport } from '@/lib/map/useReport'
import { ApolloError, QueryResult, gql, useQuery } from '@apollo/client'
import { atom, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import {
  SpecificViewConfig,
  StatisticalDataType,
  ViewType,
} from './reportContext'
import { Tileset } from './types'

export type DataByBoundary =
  SourceStatsByBoundaryQuery['choroplethDataForSource']

type SourceStatsByBoundaryQueryResult = QueryResult<
  SourceStatsByBoundaryQuery,
  SourceStatsByBoundaryQueryVariables
>

export const choroplethErrorsAtom = atom<
  Record<
    // viewID
    string,
    // Error payload
    string | ApolloError | undefined
  >
>({})

const useDataByBoundary = ({
  view,
  tileset,
}: {
  view?: SpecificViewConfig<ViewType.Map> | null
  tileset: Tileset
  // Source fields are the numeric data columns from the external data source
  getSourceFieldNames?: boolean
}) => {
  const report = useReport()

  // If mapBounds is required, send dummy empty bounds on the first request
  // This is required for fetchMore() to work, which is used to add data to
  // the map when the user pans/zooms
  // Passing the actual mapBounds with useMapBounds() here resets the query
  // on every pan, which creates flicker and poor performance
  const mapBounds = tileset.useBoundsInDataQuery
    ? { east: 0, west: 0, north: 0, south: 0 }
    : null
  const analyticalAreaType = tileset.analyticalAreaType

  const { useAdvancedStatistics, advancedStatisticsConfig } =
    view?.mapOptions?.choropleth || {}

  const sourceId =
    report.report.layers.find(
      (l) => l.id === view?.mapOptions.choropleth.layerId
    )?.source || advancedStatisticsConfig?.sourceIds[0]

  const query = useQuery<
    SourceStatsByBoundaryQuery,
    SourceStatsByBoundaryQueryVariables
  >(CHOROPLETH_STATS_FOR_SOURCE, {
    variables: {
      sourceId: sourceId!,
      analyticalAreaType: analyticalAreaType!,
      mode: view?.mapOptions?.choropleth.mode,
      field:
        view?.mapOptions?.choropleth.mode === ChoroplethMode.Field
          ? view?.mapOptions?.choropleth.field
          : undefined,
      formula:
        view?.mapOptions?.choropleth.mode === ChoroplethMode.Formula
          ? view?.mapOptions?.choropleth.formula
          : undefined,
      mapBounds,
    },
    skip:
      useAdvancedStatistics ||
      !view?.mapOptions ||
      !sourceId ||
      !analyticalAreaType,
    notifyOnNetworkStatusChange: true, // required to mark loading: true on fetchMore()
  })

  const statisticsQuery = useQuery<StatisticsQuery, StatisticsQueryVariables>(
    STATISTICS_QUERY,
    {
      variables: {
        categoryKey:
          view?.mapOptions?.choropleth.dataType === StatisticalDataType.Nominal
            ? view?.mapOptions?.choropleth.advancedStatisticsDisplayField
            : undefined,
        countKey:
          view?.mapOptions?.choropleth.dataType ===
          StatisticalDataType.Continuous
            ? view?.mapOptions?.choropleth.advancedStatisticsDisplayField
            : undefined,
        config: {
          ...(advancedStatisticsConfig! || {}),
          groupByArea: analyticalAreaType!,
          returnColumns: ['gss', 'label']
            .concat(
              view?.mapOptions?.choropleth.dataType ===
                StatisticalDataType.Nominal
                ? ['category']
                : ['count']
            )
            .concat(
              view?.mapOptions?.choropleth.advancedStatisticsDisplayField
                ? [view?.mapOptions?.choropleth.advancedStatisticsDisplayField]
                : []
            ),
          // .concat(
          //   advancedStatisticsConfig?.preGroupByCalculatedColumns?.map(
          //     (c) => c.name
          //   ) || []
          // )
          // .concat(
          //   advancedStatisticsConfig?.calculatedColumns?.map((c) => c.name) ||
          //     []
          // ),
        },
        mapBounds,
      },
      skip:
        !useAdvancedStatistics ||
        !advancedStatisticsConfig ||
        !analyticalAreaType,
      notifyOnNetworkStatusChange: true, // required to mark loading: true on fetchMore()
    }
  )

  const setChoroplethErrors = useSetAtom(choroplethErrorsAtom)

  useEffect(() => {
    if (view?.id) {
      if (query.error) {
        setChoroplethErrors((prev) => ({
          ...prev,
          [view?.id!]: query.error,
        }))
      } else {
        setChoroplethErrors((prev) => {
          const { [view?.id!]: _, ...rest } = prev
          return rest
        })
      }
    }
  }, [view, query])

  return useAdvancedStatistics ? statisticsQuery : query
}

export const CHOROPLETH_STATS_FOR_SOURCE = gql`
  query SourceStatsByBoundary(
    $sourceId: String!
    $analyticalAreaType: AnalyticalAreaType!
    $mode: ChoroplethMode
    $field: String
    $formula: String
    $mapBounds: MapBounds
  ) {
    choroplethDataForSource(
      sourceId: $sourceId
      analyticalAreaKey: $analyticalAreaType
      mode: $mode
      field: $field
      formula: $formula
      mapBounds: $mapBounds
    ) {
      label
      gss
      count
      formattedCount
      category
      row
      columns
      gssArea {
        point {
          type
          geometry {
            type
            coordinates
          }
        }
      }
    }
  }
`

export const STATISTICS_QUERY = gql`
  query Statistics(
    $config: StatisticsConfig!
    $categoryKey: String
    $countKey: String
    $mapBounds: MapBounds
  ) {
    statisticsForChoropleth(
      statsConfig: $config
      categoryKey: $categoryKey
      countKey: $countKey
      mapBounds: $mapBounds
    ) {
      label
      gss
      count
      formattedCount
      category
      columns
      gssArea {
        point {
          type
          geometry {
            type
            coordinates
          }
        }
      }
    }
  }
`

export default useDataByBoundary
