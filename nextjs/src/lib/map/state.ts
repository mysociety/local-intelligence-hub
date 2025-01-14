import { DataSourceType } from '@/__generated__/graphql'
import { atom, useAtom } from 'jotai'
import { MapboxGeoJSONFeature } from 'mapbox-gl'
import {
  parseAsBoolean,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
  useQueryStates,
} from 'nuqs'

export const mapHasLoaded = atom(false)
export const isDataConfigOpenAtom = atom(false)
export const selectedSourceMarkerAtom = atom<MapboxGeoJSONFeature | null>(null)

export function useExplorerState() {
  const [state, setState] = useQueryStates(
    {
      entity: parseAsStringEnum(['area', 'record', '']).withDefault(''),
      id: parseAsString.withDefault(''),
      showExplorer: parseAsBoolean.withDefault(false),
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

export type StarredState = ExplorerState & {
  name: string
  icon?: DataSourceType
}

export function useViewState() {
  return useQueryState('view', parseAsString)
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
