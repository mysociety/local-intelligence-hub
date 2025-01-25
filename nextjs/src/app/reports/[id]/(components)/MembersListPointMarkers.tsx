'use client'

import { BACKEND_URL } from '@/env'
import { selectedSourceMarkerAtom, useLoadedMap } from '@/lib/map'
import { useAtom } from 'jotai'
import { MapMouseEvent } from 'mapbox-gl'
import { useEffect } from 'react'
import { Layer, Source } from 'react-map-gl'
import { PLACEHOLDER_LAYER_ID_MARKERS } from './MapView'
import MarkerPopup from './MarkerPopup'
export const DEFAULT_MARKER_COLOUR = '#678DE3'

const MEMBERS_LOAD_ZOOM = 8
const MIN_MEMBERS_DISPLAY_ZOOM = 10

export function MembersListPointMarkers({
  externalDataSourceId,
  index,
  mapboxPaint,
  mapboxLayout,
}: {
  externalDataSourceId: string
  index: number
  mapboxPaint?: any
  mapboxLayout?: any
}) {
  const mapbox = useLoadedMap()
  const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(
    selectedSourceMarkerAtom
  )

  const layerId = `${externalDataSourceId}-marker`

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

      map.on('mouseover', layerId, handleMouseOver)
      map.on('mouseleave', layerId, handleMouseLeave)
      map.on('touchstart', layerId, handleTouchStart)

      return () => {
        map.off('mouseover', layerId, handleMouseOver)
        map.off('mouseleave', layerId, handleMouseLeave)
        map.off('touchstart', layerId, handleTouchStart)
      }
    },
    [layerId, mapbox.loadedMap, externalDataSourceId, setSelectedSourceMarker]
  )

  return (
    <>
      <Source
        id={externalDataSourceId}
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
          id={layerId}
          source={externalDataSourceId}
          source-layer={'generic_data'}
          type="circle"
          paint={{
            'circle-radius': 8,
            'circle-color': DEFAULT_MARKER_COLOUR,
            ...(mapboxPaint || {}),
          }}
          layout={mapboxLayout}
          minzoom={MIN_MEMBERS_DISPLAY_ZOOM}
        />
      </Source>
      <MarkerPopup />
    </>
  )
}
