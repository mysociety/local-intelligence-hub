'use client'
import { useExplorerState, useLoadedMap } from '@/lib/map'
import { useEffect } from 'react'
import { Tileset } from './types'

const useClickOnBoundaryEvents = (tileset?: Tileset | null) => {
  const { loadedMap } = useLoadedMap()
  const [explorer, setDetail] = useExplorerState()
  const selectedBoundary = explorer.entity === 'area' ? explorer.id : null

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
      loadedMap?.on('click', `${tileset.mapboxSourceId}-fill`, (event: any) => {
        try {
          const feature = event.features?.[0]
          if (feature) {
            if (feature.source === tileset.mapboxSourceId) {
              const id = feature.properties?.[tileset.promoteId]
              if (id) {
                // If already selected boundary, deselect it
                if (selectedBoundary === id) {
                  setDetail({ entity: '', id: null, showExplorer: false })
                  return
                } else {
                  setDetail({ entity: 'area', id, showExplorer: true })
                }
              }
            }
          }
        } catch (e) {
          console.error('Failed to select constituency', e)
        }
      })
    },
    [loadedMap, tileset, explorer, setDetail]
  )
}

export default useClickOnBoundaryEvents
