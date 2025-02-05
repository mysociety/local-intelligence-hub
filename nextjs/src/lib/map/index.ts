'use client'

import ColorHash from 'color-hash'
import { useLoadedMap } from '.'

var colorHash = new ColorHash()

export const layerColour = (index: any, id?: any) => {
  const arr = ['hsl(222, 69%, 65%)', 'hsl(305, 50%, 48%)']
  if (
    typeof index === 'number' &&
    Number.isInteger(index) &&
    index < arr.length
  ) {
    return arr[index]
  }
  return colorHash.hex(id || index)
}

export function layerIdColour(id: string) {
  return colorHash.hex(id)
}

export type MapboxImageSource = {
  url: () => string
  name: string
}

export * from './state'
export { useLoadedMap } from './useLoadedMap'
export { useMapIcons } from './useMapIcons'

// The @ts-ignore lines here are because the mapboxgl.Map
// type and the react-map-gl MapInstance types have
// slight (erroneous) inconsistencies.
export type MapLoader = ReturnType<typeof useLoadedMap>
