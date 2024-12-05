'use client'
import {
  MapReportLayerAnalyticsQuery,
  MapReportLayerAnalyticsQueryVariables,
} from '@/__generated__/graphql'
import useMapMarkerImages from '@/components/useMapMarkerImages'
import { useQuery } from '@apollo/client'
import React from 'react'
import { MAP_REPORT_LAYER_ANALYTICS } from '../../gql_queries'
import { useReport } from '../ReportProvider'
import { ExternalDataSourcePointMarkers } from './ExternalDataSourcePointMarkers'

const ReportMapMarkers: React.FC = () => {
  const { report } = useReport()
  useMapMarkerImages()

  const analytics = useQuery<
    MapReportLayerAnalyticsQuery,
    MapReportLayerAnalyticsQueryVariables
  >(MAP_REPORT_LAYER_ANALYTICS, {
    variables: {
      reportID: report.id,
    },
  })

  if (!analytics.data) return null

  return (
    <div>
      {analytics.data?.mapReport?.layers.map((layer, index) => (
        <ExternalDataSourcePointMarkers
          key={layer?.source?.id || index}
          index={index}
          externalDataSourceId={layer?.source?.id}
        />
      ))}
    </div>
  )
}

export default ReportMapMarkers
