import {
  AnalyticalAreaType,
  SourceStatsByBoundaryQuery,
  SourceStatsByBoundaryQueryVariables,
} from '@/__generated__/graphql'
import { gql, useQuery } from '@apollo/client'
import { MapReportExtended } from './reportContext'

export type DataByBoundary =
  SourceStatsByBoundaryQuery['choroplethDataForSource']

const useDataByBoundary = ({
  report,
  boundaryType,
}: {
  report?: MapReportExtended | undefined
  boundaryType?: AnalyticalAreaType
}) => {
  const query = useQuery<
    SourceStatsByBoundaryQuery,
    SourceStatsByBoundaryQueryVariables
  >(CHOROPLETH_STATS_FOR_SOURCE, {
    variables: {
      sourceId: report?.displayOptions.dataVisualisation.dataSource!,
      boundaryType: boundaryType!,
      field: report?.displayOptions.dataVisualisation.dataSourceField! || '',
    },
    skip: !report?.displayOptions.dataVisualisation.dataSource || !boundaryType,
  })

  return { ...query, data: query.data?.choroplethDataForSource || [] }
}

const CHOROPLETH_STATS_FOR_SOURCE = gql`
  query SourceStatsByBoundary(
    $sourceId: String!
    $boundaryType: AnalyticalAreaType!
    $field: String!
  ) {
    choroplethDataForSource(
      sourceId: $sourceId
      analyticalAreaKey: $boundaryType
      field: $field
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
