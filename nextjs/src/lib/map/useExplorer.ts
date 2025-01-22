import { useQueryStates } from 'nuqs'

import {
  AreaGeometryQuery,
  AreaGeometryQueryVariables,
  RecordGeometryQuery,
  RecordGeometryQueryVariables,
} from '@/__generated__/graphql'
import { gql, useApolloClient } from '@apollo/client'
import * as z from 'zod'
import { useLoadedMap } from '.'
import { createNuqsParserFromZodResolver } from '../parsers'

export const EXPLORER_ENTITY_TYPES = ['area', 'record', ''] as const

export const entityResolver = z
  .enum(EXPLORER_ENTITY_TYPES)
  .optional()
  .default('')
export const idResolver = z.string().optional().default('')
export const showExplorerResolver = z.boolean().optional().default(false)

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
