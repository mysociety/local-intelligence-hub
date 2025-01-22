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
      mode: report?.displayOptions.dataVisualisation.choroplethMode,
      field: report?.displayOptions.dataVisualisation.dataSourceField,
      formula: report?.displayOptions.dataVisualisation.formula,
    },
    skip: !report?.displayOptions.dataVisualisation.dataSource || !boundaryType,
  })

  return { ...query, data: query.data?.choroplethDataForSource || [] }
}

const CHOROPLETH_STATS_FOR_SOURCE = gql`
  query SourceStatsByBoundary(
    $sourceId: String!
    $boundaryType: AnalyticalAreaType!
    $mode: ChoroplethMode
    $field: String
    $formula: String
  ) {
    choroplethDataForSource(
      sourceId: $sourceId
      analyticalAreaKey: $boundaryType
      mode: $mode
      field: $field
      formula: $formula
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
