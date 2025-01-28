import {
  SourceStatsByBoundaryQuery,
  SourceStatsByBoundaryQueryVariables,
} from '@/__generated__/graphql'
import { useReport } from '@/lib/map/useReport'
import { QueryResult, gql, useQuery } from '@apollo/client'
import { IMapOptions } from './reportContext'
import { Tileset } from './types'

export type DataByBoundary =
  SourceStatsByBoundaryQuery['choroplethDataForSource']

type SourceStatsByBoundaryQueryResult = QueryResult<
  SourceStatsByBoundaryQuery,
  SourceStatsByBoundaryQueryVariables
>

const useDataByBoundary = ({
  mapOptions,
  tileset,
}: {
  mapOptions?: IMapOptions
  tileset: Tileset
  // Source fields are the numeric data columns from the external data source
  getSourceFieldNames?: boolean
}): SourceStatsByBoundaryQueryResult => {
  const report = useReport()
  const sourceId = report.report.layers.find(
    (l) => l.id === mapOptions?.choropleth.layerId
  )?.source

  // If mapBounds is required, send dummy empty bounds on the first request
  // Skipping the first query means that fetchMore() doesn't work
  // fetchMore() is required to add data to the map when the user pans/zooms
  // Passing the actual mapBounds with useMapBounds() here resets the query
  // on every pan, which creates flicker and poor performance
  const mapBounds = tileset.useBoundsInDataQuery
    ? { east: 0, west: 0, north: 0, south: 0 }
    : null
  const analyticalAreaType = tileset.analyticalAreaType

  return useQuery<
    SourceStatsByBoundaryQuery,
    SourceStatsByBoundaryQueryVariables
  >(CHOROPLETH_STATS_FOR_SOURCE, {
    variables: {
      sourceId: sourceId!,
      analyticalAreaType: analyticalAreaType!,
      mode: mapOptions?.choropleth.mode,
      field: mapOptions?.choropleth.field,
      formula: mapOptions?.choropleth.formula,
      mapBounds,
    },
    skip: !mapOptions || !sourceId || !analyticalAreaType,
    notifyOnNetworkStatusChange: true, // required to mark loading: true on fetchMore()
  })
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

export default useDataByBoundary
