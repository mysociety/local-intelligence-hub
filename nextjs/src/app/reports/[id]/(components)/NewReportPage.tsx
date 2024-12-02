'use client'

import { BACKEND_URL } from '@/env'
import { authenticationHeaders } from '@/lib/auth'
import { RequestTransformFunction } from 'mapbox-gl'
import Map from 'react-map-gl'
import UKConstituencies from './MapLayers/UKConstituencies'
import { useReport } from './ReportProvider'

export default function ReportPage() {
  const { reportConfig } = useReport()

  return (
    <div className="w-full h-full pointer-events-auto">
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        mapStyle={
          reportConfig?.showStreetDetails
            ? 'mapbox://styles/commonknowledge/clubx087l014y01mj1bv63yg8'
            : 'mapbox://styles/commonknowledge/clty3prwh004601pr4nqn7l9s'
        }
        transformRequest={mapboxTransformRequest}
      >
        <UKConstituencies />
      </Map>
    </div>
  )
}

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
