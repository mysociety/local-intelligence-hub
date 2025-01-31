'use client'

import { DataSourceType } from '@/__generated__/graphql'
import { BACKEND_URL } from '@/env'
import { selectedSourceMarkerAtom, useLoadedMap } from '@/lib/map'
import { useReport } from '@/lib/map/useReport'
import { useAtom } from 'jotai'
import { MapMouseEvent } from 'mapbox-gl'
import { useEffect } from 'react'
import { Layer, Source } from 'react-map-gl'
import { IMapLayer } from '../reportContext'
import { PLACEHOLDER_LAYER_ID_MARKERS } from './MapView'
import MarkerPopup from './MarkerPopup'
export const DEFAULT_MARKER_COLOUR = '#678DE3'

const MEMBERS_LOAD_ZOOM = 8
export const MIN_MEMBERS_DISPLAY_ZOOM = 10
export const EXTERNAL_DATA_SOURCE_MAPBOX_SOURCE_ID_PREFIX =
  'mapped-external-data-source'

export function MembersListPointMarkers({
  mapLayerId,
  externalDataSourceId,
  dataSourceType,
  mapLayerConfig,
}: {
  mapLayerId: string
  externalDataSourceId: string
  dataSourceType?: DataSourceType
  mapLayerConfig?: IMapLayer
}) {
  const report = useReport()
  const mapbox = useLoadedMap()
  const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(
    selectedSourceMarkerAtom
  )

  const mapboxLayerId = `${mapLayerId}-marker`
  const mapboxSourceId = `${mapLayerId}-${EXTERNAL_DATA_SOURCE_MAPBOX_SOURCE_ID_PREFIX}`

  useEffect(
    function selectMarker() {
      const map = mapbox.loadedMap
      if (!map) return

      const handleMouseOver = (event: MapMouseEvent) => {
        const feature = event.features?.[0]
        if (feature?.properties?.id && mapLayerConfig?.visible) {
          setSelectedSourceMarker(feature)
        }
      }

      const handleMouseLeave = (event: MapMouseEvent) => {
        setSelectedSourceMarker(null)
      }

      const handleTouchStart = (event: mapboxgl.MapTouchEvent) => {
        const feature = event.features?.[0]
        if (feature?.properties?.id && mapLayerConfig?.visible) {
          setSelectedSourceMarker(feature)
        }
      }

      map.on('mouseover', mapboxLayerId, handleMouseOver)
      map.on('mouseleave', mapboxLayerId, handleMouseLeave)
      map.on('touchstart', mapboxLayerId, handleTouchStart)

      return () => {
        map.off('mouseover', mapboxLayerId, handleMouseOver)
        map.off('mouseleave', mapboxLayerId, handleMouseLeave)
        map.off('touchstart', mapboxLayerId, handleTouchStart)
      }
    },
    [
      mapboxLayerId,
      mapbox.loadedMap,
      externalDataSourceId,
      setSelectedSourceMarker,
    ]
  )

  return (
    <>
      <Source
        id={mapboxSourceId}
        type="vector"
        url={new URL(
          `/tiles/external-data-source/${externalDataSourceId}/tiles.json`,
          BACKEND_URL
        ).toString()}
        minzoom={MEMBERS_LOAD_ZOOM}
        maxzoom={MEMBERS_LOAD_ZOOM}
      >
        <Layer
          beforeId={PLACEHOLDER_LAYER_ID_MARKERS}
          id={mapboxLayerId}
          source={mapboxSourceId}
          source-layer={'generic_data'}
          type="circle"
          paint={{
            'circle-color': mapLayerConfig?.colour || DEFAULT_MARKER_COLOUR,
            'circle-radius': mapLayerConfig?.circleRadius || 5,
          }}
          layout={{
            visibility: mapLayerConfig?.visible ? 'visible' : 'none',
          }}
          minzoom={mapLayerConfig?.minZoom || MIN_MEMBERS_DISPLAY_ZOOM}
        />
        <Layer
          beforeId={PLACEHOLDER_LAYER_ID_MARKERS}
          id={`${mapboxLayerId}-icon`}
          source={mapboxSourceId}
          source-layer={'generic_data'}
          type="symbol"
          layout={{
            'icon-image': dataSourceType,
            'icon-size': (mapLayerConfig?.circleRadius || 5) / 24,
            visibility: mapLayerConfig?.visible ? 'visible' : 'none',
          }}
          minzoom={mapLayerConfig?.minZoom || MIN_MEMBERS_DISPLAY_ZOOM}
        />
      </Source>
      <MarkerPopup />
    </>
  )
}
