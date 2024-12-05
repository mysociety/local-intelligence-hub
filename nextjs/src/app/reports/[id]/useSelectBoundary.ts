'use client'
import { useLoadedMap } from '@/lib/map'
import { atom, useAtom } from 'jotai'
import { useEffect } from 'react'
import { Tileset } from './types'

export const selectedBoundaryAtom = atom<string | null>(null)

const useSelectBoundary = (tileset?: Tileset | null) => {
  const { loadedMap } = useLoadedMap()
  const [selectedBoundary, setSelectedBoundary] = useAtom(selectedBoundaryAtom)

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
                console.log('Selected constituency:', id)
                setSelectedBoundary(id)

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
