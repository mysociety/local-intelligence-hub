'use client'

import {
  DeleteMapReportMutation,
  DeleteMapReportMutationVariables,
  MapLayerInput,
  PatchMapReportMutation,
  PatchMapReportMutationVariables,
  UpdateMapReportMutation,
  UpdateMapReportMutationVariables,
} from '@/__generated__/graphql'
import {
  DELETE_MAP_REPORT,
  PATCH_MAP_REPORT,
  UPDATE_MAP_REPORT,
} from '@/app/reports/[id]/gql_queries'
import ReportContext, {
  AddSourcePayload,
  IDisplayOptions,
  MapReportWithTypedJSON,
  displayOptionsSchema,
} from '@/app/reports/[id]/reportContext'
import { StarredState, StarredStateUnique, starId } from '@/lib/map'
import { prepareMapReportForInput } from '@/lib/map/mapReportUpdate'
import { toastPromise } from '@/lib/toast'
import { ApolloClient, FetchResult, useApolloClient } from '@apollo/client'
import * as jsonpatch from 'fast-json-patch'
import { WritableDraft, produce } from 'immer'
import { capitalize, isEqual } from 'lodash'
import { useRouter } from 'next/navigation'
import { useContext } from 'react'
import toSpaceCase from 'to-space-case'
import { v4 } from 'uuid'

export const useReport = () => {
  const { report, ...restOfReport } = useContext(ReportContext)
  const router = useRouter()
  const client = useApolloClient()

  return {
    report,
    ...restOfReport,
    deleteReport,
    refreshReportData: () => refreshReportData(client),
    updateReport,
    addStarredItem,
    removeStarredItem,
    clearAllStarredItems,
    updateLayer,
    removeLayer,
    addLayer,
    isStarred,
    toggleStarred,
  }

  function updateReport(
    editedOutput: (
      draft: WritableDraft<
        Omit<MapReportWithTypedJSON, 'layers'> & { layers: MapLayerInput[] }
      >
    ) => void
  ) {
    const updatedReport = produce(report, editedOutput)
    // Split out displayOptions and handle them separately
    const { displayOptions: newDisplayOptions, ...newReport } = updatedReport
    if (newDisplayOptions) {
      // Handle displayOptions using patch
      patchReportDisplayOptions(newDisplayOptions)
    }
    if (newReport) {
      // Handle report DB field updates using update
      updateReportDBFields(newReport)
    }
  }

  function updateReportDBFields(
    newReport: Omit<MapReportWithTypedJSON, 'layers' | 'displayOptions'> & {
      layers: MapLayerInput[]
    }
  ) {
    const { displayOptions, ...oldReport } = report
    if (isEqual(oldReport, newReport)) return

    const input = prepareMapReportForInput(newReport)
    if (!Object.keys(input).length) {
      console.warn('No changes to report')
      return
    }

    const update = updateMapReport({ input }, client)

    toastPromise(update, {
      loading: 'Saving...',
      success: () => {
        return {
          title: 'Report saved',
          description: `Updated ${Object.keys(input).map(toSpaceCase).join(', ')}`,
        }
      },
      error: `Couldn't save report`,
    }).finally(() => {
      refreshReportData(client)
    })
  }

  function patchReportDisplayOptions(__newIDisplayOptions: IDisplayOptions) {
    const {
      data: newIDisplayOptions,
      success,
      error,
    } = displayOptionsSchema.safeParse(__newIDisplayOptions)
    if (!success || error || !newIDisplayOptions) {
      console.error('Invalid report config', error)
      return
    }
    if (isEqual(report.displayOptions, newIDisplayOptions)) {
      console.warn('No changes to report')
      return
    }
    const patch = jsonpatch.compare(report.displayOptions, newIDisplayOptions)
    if (!patch.length) {
      console.warn('No changes to report')
      return
    }
    const update = client.mutate<
      PatchMapReportMutation,
      PatchMapReportMutationVariables
    >({
      mutation: PATCH_MAP_REPORT,
      variables: {
        patch,
        reportId: report.id,
      },
    })
    toastPromise(update, {
      loading: 'Saving...',
      success: () => {
        return {
          title: 'Report saved',
          description:
            // Print out JSON patch changes in a human readable format, using spaceCase
            patch
              .map((p) => {
                const { op, path } = p
                const changedDataPath = path.split('/').map(toSpaceCase).pop()
                // .join(' -> ')
                const humanReadableOp = op
                  .replace('replace', 'Updated')
                  .replace('add', 'Added')
                  .replace('remove', 'Reset')
                return `${capitalize(humanReadableOp)} ${changedDataPath}`
              })
              .join(', ') || 'No changes',
        }
      },
      error: `Couldn't save report`,
    })
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

  function removeLayer(sourceId: string) {
    updateReport((draft) => {
      draft.layers = draft.layers?.filter((l) => l.source !== sourceId)
    })
  }

  function addLayer(source: AddSourcePayload) {
    updateReport((draft) => {
      if (!draft.layers?.find((l) => l.source === source.id)) {
        draft.layers = draft.layers || []
        draft.layers.push({
          id: v4(),
          name: source.name,
          source: source.id,
        })
      }
    })
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
      include: ['GetMapReport', 'MapReportLayerAnalytics'],
    }),
    {
      loading: 'Refreshing report data...',
      success: 'Report data updated',
      error: `Couldn't refresh report data`,
    }
  )
}
