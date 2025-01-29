'use client'

import { BACKEND_URL } from '@/env'
import { selectedSourceMarkerAtom, useLoadedMap } from '@/lib/map'
import { useAtom } from 'jotai'
import { MapMouseEvent, PaintSpecification } from 'mapbox-gl'
import { useEffect } from 'react'
import { Layer, Source } from 'react-map-gl'
import { PLACEHOLDER_LAYER_ID_MARKERS } from './MapView'
import MarkerPopup from './MarkerPopup'
export const DEFAULT_MARKER_COLOUR = '#678DE3'

const MEMBERS_LOAD_ZOOM = 8
const MIN_MEMBERS_DISPLAY_ZOOM = 10
export const EXTERNAL_DATA_SOURCE_MAPBOX_SOURCE_ID_PREFIX =
  'mapped-external-data-source'

export function MembersListPointMarkers({
  mapLayerId,
  externalDataSourceId,
  mapboxPaint,
}: {
  mapLayerId: string
  externalDataSourceId: string
  mapboxPaint?: PaintSpecification
}) {
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
        if (feature?.properties?.id) {
          setSelectedSourceMarker(feature)
        }
      }

      const handleMouseLeave = (event: MapMouseEvent) => {
        setSelectedSourceMarker(null)
      }

      const handleTouchStart = (event: mapboxgl.MapTouchEvent) => {
        const feature = event.features?.[0]
        if (feature?.properties?.id) {
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
            'circle-radius': 8,
            'circle-color': DEFAULT_MARKER_COLOUR,
            ...(mapboxPaint || {}),
          }}
          minzoom={MIN_MEMBERS_DISPLAY_ZOOM}
        />
      </Source>
      <MarkerPopup />
    </>
  )
}
