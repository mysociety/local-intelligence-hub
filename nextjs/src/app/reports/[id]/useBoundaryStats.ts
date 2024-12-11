import {
  AnalyticalAreaType,
  MapReportDataByAreaQuery,
  MapReportDataByAreaQueryVariables,
} from '@/__generated__/graphql'
import { useQuery } from '@apollo/client'
import { MAP_REPORT_DATA_BY_AREA } from './gql_queries'
import { MapReportExtended } from './reportContext'
import { ENABLED_ANALYTICAL_AREA_TYPES } from './types'

export type StatsByBoundary = ReturnType<typeof useBoundaryStats>

const useBoundaryStats = (
  report: MapReportExtended | undefined,
  boundaryType: AnalyticalAreaType
) => {
  if (!ENABLED_ANALYTICAL_AREA_TYPES.includes(boundaryType)) {
    throw new Error('Invalid boundary type')
  }

  const selectedLayer = report?.layers?.find(
    (layer) =>
      layer.id === report?.displayOptions?.dataVisualisation?.dataSource
  )

  const canQuery = !!report && selectedLayer?.source.dataType === 'AREA_STATS'

  const boundaryAnalytics = useQuery<
    MapReportDataByAreaQuery,
    MapReportDataByAreaQueryVariables
  >(MAP_REPORT_DATA_BY_AREA, {
    variables: {
      reportID: report?.id,
      analyticalAreaType: boundaryType,
      layerIds: selectedLayer?.id ? [selectedLayer.id] : [],
    },
    skip: !canQuery,
  })

  return boundaryAnalytics.data?.mapReport.importedDataByArea || []
}

export default useBoundaryStats
