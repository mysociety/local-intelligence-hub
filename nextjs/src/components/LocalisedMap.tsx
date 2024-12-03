import { BACKEND_URL } from '@/env'
import { authenticationHeaders } from '@/lib/auth'
import { atom, useAtom } from 'jotai'
import { RequestTransformFunction } from 'mapbox-gl'
import React from 'react'
import Map, { ViewState } from 'react-map-gl'

interface LocalisedMapProps {
  children?: React.ReactNode
  showStreetDetails?: boolean
  initViewCountry?: keyof typeof INITIAL_VIEW_STATES
}

const INITIAL_VIEW_STATES = {
  uk: {
    longitude: -2.296605,
    latitude: 53.593349,
    zoom: 6,
  },
}

const viewStateAtom = atom<Partial<ViewState>>()

const LocalisedMap: React.FC<LocalisedMapProps> = ({
  children,
  showStreetDetails,
  initViewCountry,
}) => {
  const [viewState, setViewState] = useAtom(viewStateAtom)

  React.useEffect(() => {
    if (!!initViewCountry) setViewState(INITIAL_VIEW_STATES[initViewCountry])
  }, [initViewCountry, setViewState])

  return (
    <Map
      {...viewState}
      onMove={(e) => setViewState(e.viewState)}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      mapStyle={
        showStreetDetails
          ? 'mapbox://styles/commonknowledge/clubx087l014y01mj1bv63yg8'
          : 'mapbox://styles/commonknowledge/clty3prwh004601pr4nqn7l9s'
      }
      transformRequest={mapboxTransformRequest}
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
