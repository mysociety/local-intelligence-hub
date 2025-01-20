import { DataSourceType, MapBounds } from '@/__generated__/graphql'
import {
  BoundaryType,
  POLITICAL_BOUNDARIES,
} from '@/app/reports/[id]/politicalTilesets'
import { Tileset } from '@/app/reports/[id]/types'
import { atom, useAtom } from 'jotai'
import { MapboxGeoJSONFeature } from 'mapbox-gl'
import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { z } from 'zod'
import { createNuqsParserFromZodResolver } from '../parsers'

export const mapHasLoaded = atom(false)
export const isDataConfigOpenAtom = atom(false)
export const selectedSourceMarkerAtom = atom<MapboxGeoJSONFeature | null>(null)
export const boundsAtom = atom<MapBounds | null>(null)
export const activeTilesetAtom = atom<Tileset | null>(null)

export const EXPLORER_ENTITY_TYPES = ['area', 'record', ''] as const

const entityResolver = z.enum(EXPLORER_ENTITY_TYPES).optional().default('')
const idResolver = z.string().optional().default('')
const showExplorerResolver = z.boolean().optional().default(false)

export const explorerStateResolver = z.object({
  entity: entityResolver,
  id: idResolver,
  showExplorer: showExplorerResolver,
})

const entityParser = createNuqsParserFromZodResolver(entityResolver)
const idParser = createNuqsParserFromZodResolver(idResolver)
const showExplorerParser = createNuqsParserFromZodResolver(showExplorerResolver)

export function useExplorerState() {
  const [state, setState] = useQueryStates(
    {
      entity: entityParser,
      id: idParser,
      showExplorer: showExplorerParser,
    },
    {
      history: 'push',
    }
  )
  const toggle = () => {
    setState((s) => ({ showExplorer: !s.showExplorer }))
  }
  return [state, setState, toggle] as const
}

export type ExplorerSuite = ReturnType<typeof useExplorerState>

export type ExplorerState = ReturnType<typeof useExplorerState>[0]

export const starredStateResolver = explorerStateResolver.extend({
  name: z.string().optional(),
  icon: z.nativeEnum(DataSourceType).optional(),
})

export type StarredState = z.infer<typeof starredStateResolver>

export function useViewState() {
  return useQueryState('view', parseAsString)
}

export function useMapBounds() {
  return useAtom(boundsAtom)
}

export function useActiveTileset(boundaryType: BoundaryType | undefined) {
  const [activeTileset, setActiveTileset] = useAtom(activeTilesetAtom)
  if (activeTileset) {
    return {
      activeTileset,
      setActiveTileset,
    }
  }

  // Fallback to the first tileset for the current BoundaryType
  const politicalTileset =
    POLITICAL_BOUNDARIES.find((t) => t.boundaryType === boundaryType) ||
    POLITICAL_BOUNDARIES[0]
  return {
    activeTileset: politicalTileset.tilesets[0],
    setActiveTileset,
  }
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
