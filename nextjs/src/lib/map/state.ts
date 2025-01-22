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

import {
  AreaGeometryQuery,
  AreaGeometryQueryVariables,
  RecordGeometryQuery,
  RecordGeometryQueryVariables,
} from '@/__generated__/graphql'
import { gql, useApolloClient } from '@apollo/client'
import { useLoadedMap } from '.'
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

export function useExplorer() {
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

  const clear = () => {
    setState({
      entity: '',
      id: '',
      showExplorer: false,
    })
  }

  const client = useApolloClient()
  const mapbox = useLoadedMap()

  async function select(options: typeof state, { bringIntoView = false } = {}) {
    setState(options)
    if (bringIntoView) {
      zoom()
    }
  }

  async function zoom() {
    if (state.entity === 'area' && state.id) {
      const geo = await client.query<
        AreaGeometryQuery,
        AreaGeometryQueryVariables
      >({
        query: GET_AREA_GEO,
        variables: {
          gss: state.id,
        },
      })
      if (geo.data?.area) {
        const bounds = geo.data.area.fitBounds
        mapbox.loadedMap?.fitBounds(bounds, {
          padding: 100,
        })
      }
    } else if (state.entity === 'record' && state.id) {
      const geo = await client.query<
        RecordGeometryQuery,
        RecordGeometryQueryVariables
      >({
        query: GET_RECORD_GEO,
        variables: {
          id: state.id,
        },
      })
      if (geo.data?.import?.geometry.coordinates) {
        mapbox.current?.flyTo({
          center: geo.data.import.geometry.coordinates as [number, number],
          zoom: 14,
        })
      }
    }
  }

  // typesript function which asserts that state.id and state.entity are not null
  // with typeguard syntax
  function isValidEntity(
    s: typeof state
  ): s is { entity: 'area' | 'record'; id: string; showExplorer: boolean } {
    return !!state.entity && !!state.id
  }

  function show() {
    if (isValidEntity(state)) {
      return setState((s) => ({ showExplorer: true }))
    }
  }

  function hide() {
    return setState((s) => ({ showExplorer: false }))
  }

  return {
    state,
    setState,
    toggle,
    clear,
    select,
    show,
    hide,
    zoom,
    isValidEntity,
  }
}

export type ExplorerSuite = ReturnType<typeof useExplorer>

export type ExplorerState = ReturnType<typeof useExplorer>['state']

const GET_RECORD_GEO = gql`
  query RecordGeometry($id: String!) {
    import: importedDataGeojsonPoint(genericDataId: $id) {
      id
      geometry {
        type
        coordinates
      }
    }
  }
`

const GET_AREA_GEO = gql`
  query AreaGeometry($gss: String!) {
    area(gss: $gss) {
      id
      fitBounds
    }
  }
`

export type ExplorerAreaBreadCrumbMapping = {
  value: string | undefined
  code: string | undefined
  type: BoundaryType
}

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
