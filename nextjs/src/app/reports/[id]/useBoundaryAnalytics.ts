import {
  AnalyticalAreaType,
  MapReportCountByAreaQuery,
  MapReportCountByAreaQueryVariables,
} from '@/__generated__/graphql'
import { useQuery } from '@apollo/client'
import { MAP_REPORT_COUNT_BY_AREA } from './gql_queries'
import { MapReportExtended } from './reportContext'

const ENABLED_ANALYTICAL_AREA_TYPES = [
  AnalyticalAreaType.ParliamentaryConstituency_2024,
  AnalyticalAreaType.AdminWard,
  AnalyticalAreaType.AdminDistrict,
]

export type StatisticByArea = ReturnType<typeof useBoundaryAnalytics>

const useBoundaryAnalytics = (
  report: MapReportExtended | undefined,
  boundaryType: AnalyticalAreaType
) => {
  if (!ENABLED_ANALYTICAL_AREA_TYPES.includes(boundaryType)) {
    throw new Error('Invalid boundary type')
  }
  const selectedLayer = report?.displayOptions?.dataVisualisation?.dataSource
  const canQuery = !!report && !!selectedLayer

  const boundaryAnalytics = useQuery<
    MapReportCountByAreaQuery,
    MapReportCountByAreaQueryVariables
  >(MAP_REPORT_COUNT_BY_AREA, {
    variables: {
      reportID: report?.id,
      analyticalAreaType: boundaryType,
      layerIds: selectedLayer ? [selectedLayer] : [],
    },
    skip: !canQuery,
  })

  return boundaryAnalytics.data?.mapReport.importedDataCountByArea || []
}

export default useBoundaryAnalytics
