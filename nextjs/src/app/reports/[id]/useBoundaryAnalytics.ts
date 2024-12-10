import {
  AnalyticalAreaType,
  MapReportAreaStatsQuery,
  MapReportAreaStatsQueryVariables,
} from '@/__generated__/graphql'
import { useQuery } from '@apollo/client'
import { MAP_REPORT_AREA_STATS } from './gql_queries'
import { MapReportExtended } from './reportContext'

export default function useBoundaryAnalytics(
  report: MapReportExtended | undefined,
  boundaryType: AnalyticalAreaType
) {
  if (!ENABLED_ANALYTICAL_AREA_TYPES.includes(boundaryType)) {
    throw new Error('Invalid boundary type')
  }

  const canQuery = !!report

  const boundaryAnalytics = useQuery<
    MapReportAreaStatsQuery,
    MapReportAreaStatsQueryVariables
  >(MAP_REPORT_AREA_STATS, {
    variables: {
      reportID: report?.id,
      analyticalAreaType: boundaryType,
    },
    skip: !canQuery,
  })

  return boundaryAnalytics.data?.mapReport.importedDataCountByArea || []
}

export type BoundaryAnalytics = ReturnType<typeof useBoundaryAnalytics>

const ENABLED_ANALYTICAL_AREA_TYPES = [
  AnalyticalAreaType.ParliamentaryConstituency_2024,
  AnalyticalAreaType.AdminWard,
  AnalyticalAreaType.AdminDistrict,
]
