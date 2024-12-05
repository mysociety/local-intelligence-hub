'use client'

import { useEffect } from 'react'

import { useLoadedMap } from '@/lib/map'
import { Tileset } from './(components)/MapLayers/types'

const useSelectBoundary = (tileset: Tileset) => {
  const { loadedMap } = useLoadedMap()

  useEffect(
    function selectConstituency() {
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
                console.log('Selected constituency:', id)
                // setSelectedConstituency(id)
                // setIsConstituencyPanelOpen(true)
                // setTab('selected')
              }
            }
          }
        } catch (e) {
          console.error('Failed to select constituency', e)
        }
      })
    },
    [loadedMap, tileset]
  )
}

export default useSelectBoundary
