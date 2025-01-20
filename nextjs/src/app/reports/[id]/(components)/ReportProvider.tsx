'use client'

import {
  DataSourceType,
  DeleteMapReportMutation,
  DeleteMapReportMutationVariables,
  GetMapReportQuery,
  InspectorDisplayType,
  MapLayerInput,
  PatchMapReportMutation,
  PatchMapReportMutationVariables,
  UpdateMapReportMutation,
  UpdateMapReportMutationVariables,
} from '@/__generated__/graphql'
import { StarredState, useSidebarLeftState } from '@/lib/map'
import { prepareMapReportForInput } from '@/lib/map/mapReportUpdate'
import { toastPromise } from '@/lib/toast'
import { FetchResult, useApolloClient } from '@apollo/client'
import * as jsonpatch from 'fast-json-patch'
import { WritableDraft, produce } from 'immer'
import { useSetAtom } from 'jotai'
import { capitalize, cloneDeep, isEqual, merge } from 'lodash'
import { useRouter } from 'next/navigation'
import { ReactNode, useContext, useEffect, useRef, useState } from 'react'
import toSpaceCase from 'to-space-case'
import { v4 } from 'uuid'
import {
  DELETE_MAP_REPORT,
  PATCH_MAP_REPORT,
  UPDATE_MAP_REPORT,
} from '../gql_queries'
import ReportContext, {
  AddSourcePayload,
  MapReportExtended,
  ReportConfig,
  defaultReportConfig,
  reportConfigTypeChecker,
} from '../reportContext'
import { navbarTitleAtom } from './ReportNavbar'

interface ReportProviderProps {
  report: GetMapReportQuery['mapReport']
  children: ReactNode
}

const ReportProvider = ({ report, children }: ReportProviderProps) => {
  const router = useRouter()
  const client = useApolloClient()
  const setNavbarTitle = useSetAtom(navbarTitleAtom)
  const [dataLoading, setDataLoading] = useState(false)
  const leftSidebarState = useSidebarLeftState()
  const autoOpenedSidebar = useRef(false)

  const reportWithDefaults = merge(
    {
      displayOptions: cloneDeep(defaultReportConfig), // prevent changing the defaults
    },
    report
  ) as MapReportExtended

  useEffect(() => {
    setNavbarTitle(report.name)
  }, [report.name])

  useEffect(() => {
    // Always ensure that the choropleth has a data source
    if (
      !!report.layers.length &&
      !report.displayOptions?.dataVisualisation?.dataSource
    ) {
      const layerPreferrablyNotAreaStat = report.layers.slice().sort((a, b) => {
        if (a.sourceData.dataType === DataSourceType.AreaStats) return 1
        if (b.sourceData.dataType === DataSourceType.AreaStats) return -1
        return 0
      })[0]

      updateReport((draft) => {
        draft.displayOptions.dataVisualisation.dataSource =
          layerPreferrablyNotAreaStat.source
      })
    }
  }, [report.layers.map((l) => l.id)])

  useEffect(() => {
    // When a data source is picked, auto-select a field
    if (
      report.displayOptions?.dataVisualisation?.dataSource &&
      !report.displayOptions?.dataVisualisation?.dataSourceField
    ) {
      const layer = report.layers.find(
        (l) =>
          l.source === report.displayOptions.dataVisualisation.dataSource &&
          !!l.sourceData.fieldDefinitions?.length
      )
      if (layer) {
        const idField = layer.sourceData.idField
        const field = layer.sourceData.fieldDefinitions?.filter(
          (f) => f.value !== idField
        )[0].value
        if (field) {
          updateReport((draft) => {
            draft.displayOptions.dataVisualisation.dataSourceField =
              layer.sourceData.fieldDefinitions?.[0].value
          })
        }
      }
    }
  }, [report.layers.map((l) => l.id)])

  useEffect(() => {
    // If there are no layers, open the left sidepanel
    if (!report.layers.length && !autoOpenedSidebar.current) {
      leftSidebarState.set(true)
      autoOpenedSidebar.current = true
    }
  }, [report.layers, autoOpenedSidebar])

  useEffect(() => {
    // If the layer has been deleted, remove it from the choropleth
    const sourceIds = report.layers.map((l) => l.source)
    const choroplethSourceId =
      report.displayOptions?.dataVisualisation?.dataSource
    if (choroplethSourceId && !sourceIds.includes(choroplethSourceId)) {
      updateReport((draft) => {
        draft.displayOptions.dataVisualisation.dataSource = undefined
        draft.displayOptions.dataVisualisation.dataSourceField = undefined
      })
    }
  }, [report.layers.map((l) => l.id)])

  return (
    <ReportContext.Provider
      value={{
        report: reportWithDefaults,
        deleteReport,
        refreshReportData,
        updateReport,
        updateLayer,
        dataLoading,
        setDataLoading,
        removeDataSource,
        addDataSource,
        addStarredItem,
        removeStarredItem,
        clearAllStarredItems,
      }}
    >
      {children}
    </ReportContext.Provider>
  )

  function updateReport(
    editedOutput: (
      draft: WritableDraft<
        Omit<MapReportExtended, 'layers'> & { layers: MapLayerInput[] }
      >
    ) => void
  ) {
    const updatedReport = produce(reportWithDefaults, editedOutput)
    // Split out displayOptions and handle them separately
    const { displayOptions: newDisplayOptions, ...newReport } = updatedReport
    // Handle displayOptions using patch
    patchReportDisplayOptions(newDisplayOptions)
    // Handle report DB field updates using update
    updateReportDBFields(newReport)
  }

  function updateReportDBFields(
    newReport: Omit<MapReportExtended, 'layers' | 'displayOptions'> & {
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

    const update = client.mutate<
      UpdateMapReportMutation,
      UpdateMapReportMutationVariables
    >({
      mutation: UPDATE_MAP_REPORT,
      variables: {
        input,
      },
    })
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
      refreshReportData()
    })
  }

  function patchReportDisplayOptions(__newReportConfig: ReportConfig) {
    const {
      data: newReportConfig,
      success,
      error,
    } = reportConfigTypeChecker.safeParse(__newReportConfig)
    if (!success || error || !newReportConfig) {
      console.error('Invalid report config', error)
      return
    }
    if (isEqual(report.displayOptions, newReportConfig)) {
      console.warn('No changes to report')
      return
    }
    const patch = jsonpatch.compare(report.displayOptions, newReportConfig)
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
                const changedDataPath = path
                  .split('/')
                  .map(toSpaceCase)
                  .join(' -> ')
                return `${capitalize(op)} ${changedDataPath}`
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

  function refreshReportData() {
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

  function updateLayer(layerId: string, updates: Partial<MapLayerInput>) {
    updateReport((draft) => {
      const layer = draft.layers?.find((l) => l.id === layerId)
      if (layer) {
        Object.assign(layer, updates)
      }
    })
  }

  function removeDataSource(sourceId: string) {
    updateReport((draft) => {
      // change layers, remove sourceId
      draft.layers = draft.layers?.filter((l) => l.source !== sourceId)
      // remove from choropleth
      if (draft.displayOptions.dataVisualisation.dataSource === sourceId) {
        draft.displayOptions.dataVisualisation.dataSource = undefined
        draft.displayOptions.dataVisualisation.dataSourceField = undefined
      }
    })
  }

  function addDataSource(source: AddSourcePayload) {
    updateReport((draft) => {
      if (!draft.layers?.find((l) => l.source === source.id)) {
        draft.layers = draft.layers || []
        draft.layers.push({
          id: v4(),
          name: source.name,
          source: source.id,
          inspectorType:
            source.dataType === DataSourceType.AreaStats
              ? InspectorDisplayType.Properties
              : InspectorDisplayType.BigNumber,
        })
      }
    })
  }

  function addStarredItem(starredItemData: StarredState) {
    updateReport((draft) => {
      if (
        !draft.displayOptions.starred.find(
          (item) => item.id === starredItemData.id
        )
      ) {
        draft.displayOptions.starred.push(starredItemData)
      }
    })
  }

  function removeStarredItem(itemId: string) {
    updateReport((draft) => {
      draft.displayOptions.starred = draft.displayOptions.starred.filter(
        (item) => item.id !== itemId
      )
    })
  }

  function clearAllStarredItems() {
    updateReport((draft) => {
      draft.displayOptions.starred = []
    })
  }
}

export default ReportProvider
export const useReport = () => useContext(ReportContext)
