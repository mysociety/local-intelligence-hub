'use client'

import {
  DataSourceType,
  DeleteMapReportMutation,
  DeleteMapReportMutationVariables,
  MapLayerInput,
  UpdateMapReportMutation,
  UpdateMapReportMutationVariables,
} from '@/__generated__/graphql'
import {
  DELETE_MAP_REPORT,
  UPDATE_MAP_REPORT,
} from '@/app/reports/[id]/gql_queries'
import ReportContext, {
  AddSourcePayload,
  StarredState,
  StarredStateUnique,
  ViewType,
  explorerDisplaySchema,
  mapLayerSchema,
  starId,
} from '@/app/reports/[id]/reportContext'
import { toastPromise } from '@/lib/toast'
import { ApolloClient, FetchResult, useApolloClient } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { useContext } from 'react'
import { v4 } from 'uuid'

export const useReport = () => {
  const { report, updateReport, ...reportContext } = useContext(ReportContext)
  const router = useRouter()
  const client = useApolloClient()

  return {
    report,
    updateReport,
    ...reportContext,
    deleteReport,
    refreshReportData: () => refreshReportData(client),
    addStarredItem,
    removeStarredItem,
    clearAllStarredItems,
    updateLayer,
    removeLayer,
    addLayer,
    isStarred,
    toggleStarred,
    getLayer,
  }

  function deleteReport() {
    const deleteMutation = client.mutate<
      DeleteMapReportMutation,
      DeleteMapReportMutationVariables
    >({
      mutation: DELETE_MAP_REPORT,
      variables: {
        id: { id: report.id },
      },
    })
    toastPromise(deleteMutation, {
      loading: 'Deleting...',
      success: (d: FetchResult) => {
        router.push('/reports')
        return 'Deleted report'
      },
      error: `Couldn't delete report`,
    })
  }

  function addStarredItem(starredItemData: StarredState) {
    updateReport((draft) => {
      const id = starId(starredItemData)
      draft.displayOptions.starred[id] = starredItemData
    })
  }

  function isStarred(entityIdentifier: StarredStateUnique) {
    return !!report.displayOptions.starred[starId(entityIdentifier)]
  }

  function toggleStarred(entityIdentifier: StarredState) {
    if (isStarred(entityIdentifier)) {
      removeStarredItem(entityIdentifier)
    } else {
      addStarredItem(entityIdentifier)
    }
  }

  function removeStarredItem(entityIdentifier: StarredStateUnique) {
    updateReport((draft) => {
      const itemId = starId(entityIdentifier)
      delete draft.displayOptions.starred[itemId]
    })
  }

  function clearAllStarredItems() {
    updateReport((draft) => {
      draft.displayOptions.starred = {}
    })
  }

  function updateLayer(layerId: string, updates: Partial<MapLayerInput>) {
    updateReport((draft) => {
      const layer = draft.layers?.find((l) => l.id === layerId)
      if (layer) {
        Object.assign(layer, updates)
      }
    })
  }

  function removeLayer(layerId: string) {
    updateReport((draft) => {
      draft.layers = draft.layers?.filter((l) => l.id !== layerId)
    })
  }

  function addLayer(source: AddSourcePayload) {
    updateReport((draft) => {
      const layerId = v4()
      draft.layers = draft.layers || []
      draft.layers.push({
        id: layerId,
        name: source.name,
        source: source.id,
      })
      // Also add a default display to the areaExplorer
      const displayId = v4()
      draft.displayOptions.areaExplorer.displays[displayId] =
        explorerDisplaySchema.parse({
          id: displayId,
          layerId,
        })
      // And add a marker layer to any map views
      Object.values(draft.displayOptions.views).forEach((view) => {
        if (
          view.type === ViewType.Map &&
          source.dataType !== DataSourceType.AreaStats
        ) {
          const mapLayerId = v4()
          view.mapOptions.layers[mapLayerId] = mapLayerSchema.parse({
            id: mapLayerId,
            layerId,
          })
        }
      })
    })
  }

  function getLayer(reportLayerId?: string) {
    if (!reportLayerId) return null
    return report.layers.find((layer) => layer.id === reportLayerId)
  }
}

export function updateMapReport(
  variables: UpdateMapReportMutationVariables,
  client: ApolloClient<object>
) {
  return client.mutate<
    UpdateMapReportMutation,
    UpdateMapReportMutationVariables
  >({
    mutation: UPDATE_MAP_REPORT,
    variables,
  })
}

export function refreshReportData(client: ApolloClient<any>) {
  // TODO: This should refresh only queries that are used by the report
  toastPromise(
    client.refetchQueries({
      include: ['GetMapReport'],
    }),
    {
      loading: 'Refreshing report data...',
      success: 'Report data updated',
      error: `Couldn't refresh report data`,
    }
  )
}
