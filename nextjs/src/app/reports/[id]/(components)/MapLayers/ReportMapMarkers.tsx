'use client'
import useMapMarkerImages from '@/components/useMapMarkerImages'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import React from 'react'
import { ViewType } from '../../reportContext'
import {
  DEFAULT_MARKER_COLOUR,
  MembersListPointMarkers,
} from '../MembersListPointMarkers'

const ReportMapMarkers: React.FC = () => {
  const report = useReport()
  const view = useView(ViewType.Map)
  useMapMarkerImages()

  const memberListSources = Object.values(
    view.currentViewOfType?.mapOptions.layers || {}
  )
    .map((ml) => ({
      ...ml,
      sourceId: report.report.layers.find((l) => l.id === ml.layerId)?.source,
    }))
    .filter((ml) => !!ml.sourceId)

  return (
    <div>
      {memberListSources.map((mapLayer) => (
        <MembersListPointMarkers
          key={mapLayer.id}
          mapLayerId={mapLayer.id}
          externalDataSourceId={mapLayer.sourceId!}
          mapboxPaint={{
            'circle-color': mapLayer.colour || DEFAULT_MARKER_COLOUR,
            'circle-opacity': mapLayer.visible ? 1 : 0,
          }}
        />
      ))}
    </div>
  )
}

export default ReportMapMarkers
