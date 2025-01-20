import {
  SourceStatsByBoundaryQuery,
  SourceStatsByBoundaryQueryVariables,
} from '@/__generated__/graphql'
import { QueryResult, gql, useQuery } from '@apollo/client'
import { MapReportExtended } from './reportContext'
import { Tileset } from './types'

export type DataByBoundary =
  SourceStatsByBoundaryQuery['choroplethDataForSource']

type SourceStatsByBoundaryQueryResult = QueryResult<
  SourceStatsByBoundaryQuery,
  SourceStatsByBoundaryQueryVariables
>

const useDataByBoundary = ({
  report,
  tileset,
}: {
  report: MapReportExtended
  tileset: Tileset
  // Source fields are the numeric data columns from the external data source
  getSourceFieldNames?: boolean
}): SourceStatsByBoundaryQueryResult => {
  // If mapBounds is required, send dummy empty bounds on the first request
  // Skipping the first query means that fetchMore() doesn't work
  // fetchMore() is required to add data to the map when the user pans/zooms
  const mapBounds = tileset.useBoundsInDataQuery
    ? { east: 0, west: 0, north: 0, south: 0 }
    : null
  const analyticalAreaType = tileset.analyticalAreaType

  return useQuery<
    SourceStatsByBoundaryQuery,
    SourceStatsByBoundaryQueryVariables
  >(CHOROPLETH_STATS_FOR_SOURCE, {
    variables: {
      sourceId: report?.displayOptions.dataVisualisation.dataSource!,
      analyticalAreaType: analyticalAreaType!,
      field: report?.displayOptions.dataVisualisation.dataSourceField!,
      mapBounds,
    },
    skip:
      !report?.displayOptions.dataVisualisation.dataSource ||
      !analyticalAreaType,
    notifyOnNetworkStatusChange: true, // required to mark loading: true on fetchMore()
  })
}

const CHOROPLETH_STATS_FOR_SOURCE = gql`
  query SourceStatsByBoundary(
    $sourceId: String!
    $analyticalAreaType: AnalyticalAreaType!
    $field: String!
    $mapBounds: MapBounds
  ) {
    choroplethDataForSource(
      sourceId: $sourceId
      analyticalAreaKey: $analyticalAreaType
      field: $field
      mapBounds: $mapBounds
    ) {
      label
      gss
      count
      formattedCount
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
