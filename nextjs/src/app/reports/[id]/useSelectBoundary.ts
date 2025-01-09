'use client'
import { useExplorerState, useLoadedMap } from '@/lib/map'
import { useEffect } from 'react'
import { Tileset } from './types'

const useHoverOverBoundaryEvents = (tileset?: Tileset | null) => {
  const { loadedMap } = useLoadedMap()
  const [explorer, setDetail] = useExplorerState()

  useEffect(
    function selectConstituency() {
      if (!tileset || !loadedMap) return
      loadedMap?.on('mouseover', `${tileset.mapboxSourceId}-fill`, () => {
        const canvas = loadedMap?.getCanvas()
        if (!canvas) return
        canvas.style.cursor = 'pointer'
      })
      loadedMap?.on('mouseleave', `${tileset.mapboxSourceId}-fill`, () => {
        const canvas = loadedMap?.getCanvas()
        if (!canvas) return
        canvas.style.cursor = ''
      })
    },
    [loadedMap, tileset, explorer, setDetail]
  )
}

export default useHoverOverBoundaryEvents
