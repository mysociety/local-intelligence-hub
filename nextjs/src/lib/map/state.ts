import { MapBounds } from '@/__generated__/graphql'
import {
  BoundaryType,
  POLITICAL_BOUNDARIES,
} from '@/app/reports/[id]/politicalTilesets'
import { PrimitiveAtom, atom, useAtom } from 'jotai'
import { MapboxGeoJSONFeature } from 'mapbox-gl'

import { ViewType } from '@/app/reports/[id]/reportContext'
import { Draft, produce } from 'immer'
import { useView } from './useView'

export const mapHasLoaded = atom(false)
export const isDataConfigOpenAtom = atom(false)
export const selectedSourceMarkerAtom = atom<MapboxGeoJSONFeature | null>(null)
export const boundsAtom = atom<Record<string, MapBounds | null>>({})
export const zoomAtom = atom<Record<string, number>>({})

export type ExplorerAreaBreadCrumbMapping = {
  value: string | undefined
  code: string | undefined
  type: BoundaryType
}

export function useViewSpecificAtom<T>(atom: PrimitiveAtom<Record<string, T>>) {
  const [val, set] = useAtom(atom)
  const view = useView(ViewType.Map)
  const viewId = view.currentViewOfType?.id
  if (!viewId) return [null, () => {}] as const
  return [
    val[viewId],
    (v: Draft<T>) =>
      set((atomValue) =>
        produce(atomValue, (draft) => {
          draft[viewId] = v
        })
      ),
  ] as const
}

export function useMapBounds() {
  return useViewSpecificAtom(boundsAtom)
}

export function useMapZoom() {
  return useViewSpecificAtom(zoomAtom)
}

export function useActiveTileset(boundaryType: BoundaryType | undefined) {
  const [zoom] = useMapZoom()

  const politicalTileset =
    POLITICAL_BOUNDARIES.find((t) => t.boundaryType === boundaryType) ||
    POLITICAL_BOUNDARIES[0]

  const tileset = politicalTileset.tilesets.filter(
    (t) => zoom !== null && zoom >= t.minZoom && zoom <= t.maxZoom
  )[0]

  // Fallback to the first tileset for the current BoundaryType
  return tileset || politicalTileset.tilesets[0]
}

const sidebarLeftStateAtom = atom(false)

export function useSidebarLeftState() {
  const [state, set] = useAtom(sidebarLeftStateAtom)
  const toggle = () => set((s) => !s)
  return { toggle, state, set }
}

export const layerEditorStateAtom = atom<
  | {
      open: false
    }
  | {
      open: true
      layerId: string
    }
>({
  open: false,
})
