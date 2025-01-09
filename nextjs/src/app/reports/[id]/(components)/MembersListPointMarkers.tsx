'use client'

import { BACKEND_URL } from '@/env'
import {
  selectedSourceMarkerAtom,
  useExplorerState,
  useLoadedMap,
} from '@/lib/map'
import { useAtom } from 'jotai'
import { MapMouseEvent } from 'mapbox-gl'
import { useEffect } from 'react'
import { Layer, Source } from 'react-map-gl'
import MarkerPopup from './MarkerPopup'
import { PLACEHOLDER_LAYER_ID_MARKERS } from './ReportPage'
export const DEFAULT_MARKER_COLOUR = '#678DE3'

const MIN_MEMBERS_ZOOM = 14

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
  const [state, set, showExplorer] = useExplorerState()

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
        console.log('handleMouseLeave', event)
        setSelectedSourceMarker(null)
      }

      const handleTouchStart = (event: mapboxgl.MapTouchEvent) => {
        const feature = event.features?.[0]
        if (feature?.properties?.id) {
          setSelectedSourceMarker(feature)
        }
      }

      const handleClick = (event: MapMouseEvent) => {
        const feature = event.features?.[0]
        if (feature?.properties?.id) {
          setSelectedSourceMarker(feature)
          set({
            entity: 'record',
            id: feature.properties.id,
            showExplorer: true,
          })
        }
      }

      map.on('mouseover', layerId, handleMouseOver)
      map.on('mouseleave', layerId, handleMouseLeave)
      map.on('click', layerId, handleClick)
      map.on('touchstart', layerId, handleTouchStart)

      return () => {
        map.off('mouseover', layerId, handleMouseOver)
        map.off('mouseleave', layerId, handleMouseLeave)
        map.off('click', layerId, handleClick)
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
        minzoom={MIN_MEMBERS_ZOOM}
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
          minzoom={MIN_MEMBERS_ZOOM}
        />
      </Source>
      <MarkerPopup />
    </>
  )
}
