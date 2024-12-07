'use client'
import useMapMarkerImages from '@/components/useMapMarkerImages'
import React from 'react'
import useMarkerAnalytics from '../../useMarkerAnalytics'
import { ExternalDataSourcePointMarkers } from '../ExternalDataSourcePointMarkers'
import MarkerPopup from '../MarkerPopup'

const ReportMapMarkers: React.FC = () => {
  const analytics = useMarkerAnalytics()
  useMapMarkerImages()

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
      <MarkerPopup />
    </div>
  )
}

export default ReportMapMarkers
