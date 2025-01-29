import { BACKEND_URL } from '@/env'
import { authenticationHeaders } from '@/lib/auth'
import { useMapBounds, useMapZoom } from '@/lib/map'
import { useExplorer } from '@/lib/map/useExplorer'
import { useReport } from '@/lib/map/useReport'
import bboxPolygon from '@turf/bbox-polygon'
import center from '@turf/center'
import { RequestTransformFunction } from 'mapbox-gl'
import React, { useMemo } from 'react'
import Map from 'react-map-gl'
import { mapMouseHandler } from './report/mapMouseHandler'

interface LocalisedMapProps {
  children?: React.ReactNode
  showStreetDetails?: boolean
  initViewCountry?: keyof typeof INITIAL_VIEW_STATES
  mapKey?: string
}

const INITIAL_VIEW_STATES = {
  uk: {
    longitude: -2.296605,
    latitude: 53.593349,
    zoom: 6,
  },
}

const LocalisedMap: React.FC<LocalisedMapProps> = ({
  children,
  showStreetDetails,
  initViewCountry = 'uk',
  mapKey,
}) => {
  const report = useReport()
  const explorer = useExplorer()
  const [zoom, _] = useMapZoom()
  const [mapBounds, __] = useMapBounds()

  const longLatFromMapBounds = useMemo(() => {
    if (!mapBounds) return null
    return center(
      bboxPolygon([
        mapBounds.east,
        mapBounds.north,
        mapBounds.west,
        mapBounds.south,
      ])
    ).geometry.coordinates
  }, [mapBounds])

  return (
    <Map
      key={mapKey || Math.random().toString()}
      initialViewState={{
        ...INITIAL_VIEW_STATES[initViewCountry],
        zoom: zoom || INITIAL_VIEW_STATES[initViewCountry].zoom,
        longitude:
          longLatFromMapBounds?.[0] ||
          INITIAL_VIEW_STATES[initViewCountry].longitude,
        latitude:
          longLatFromMapBounds?.[1] ||
          INITIAL_VIEW_STATES[initViewCountry].latitude,
      }}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      mapStyle={
        showStreetDetails
          ? 'mapbox://styles/commonknowledge/clubx087l014y01mj1bv63yg8'
          : `mapbox://styles/commonknowledge/cm4cjnvff01mx01sdcmpbfuz5${process.env.NODE_ENV !== 'production' ? '/draft' : ''}`
      }
      transformRequest={mapboxTransformRequest}
      onClick={mapMouseHandler(report, explorer)}
    >
      {children}
    </Map>
  )
}

export default LocalisedMap

const mapboxTransformRequest: RequestTransformFunction = (url) => {
  if (url.includes(BACKEND_URL) && !url.includes('tiles.json')) {
    return {
      url,
      headers: authenticationHeaders(),
      method: 'GET',
    }
  }
  return { url }
}
