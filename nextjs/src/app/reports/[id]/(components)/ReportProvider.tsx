'use client'

import {
  DataSourceType,
  DeleteMapReportMutation,
  DeleteMapReportMutationVariables,
  Exact,
  InspectorDisplayType,
  MapLayerInput,
  MapReportInput,
  UpdateMapReportMutation,
  UpdateMapReportMutationVariables,
} from '@/__generated__/graphql'
import { useSidebarLeftState } from '@/lib/map'
import { createMapReportUpdate } from '@/lib/map/mapReportUpdate'
import { toastPromise } from '@/lib/toast'
import {
  ApolloCache,
  DefaultContext,
  FetchResult,
  MutationUpdaterFunction,
  useApolloClient,
} from '@apollo/client'
import { WritableDraft, produce } from 'immer'
import { useSetAtom } from 'jotai'
import { isEqual } from 'lodash'
import { useRouter } from 'next/navigation'
import { ReactNode, useContext, useEffect, useRef, useState } from 'react'
import toSpaceCase from 'to-space-case'
import { v4 } from 'uuid'
import { DELETE_MAP_REPORT, UPDATE_MAP_REPORT } from '../gql_queries'
import ReportContext, {
  AddSourcePayload,
  MapReportExtended,
  VisualisationType,
} from '../reportContext'
import { navbarTitleAtom } from './ReportNavbar'

interface ReportProviderProps {
  report: MapReportExtended
  children: ReactNode
}

export type OptimisticMutationUpdateMapLayers = MutationUpdaterFunction<
  UpdateMapReportMutation,
  Exact<{
    input: MapReportInput
  }>,
  DefaultContext,
  ApolloCache<any>
>

const ReportProvider = ({ report, children }: ReportProviderProps) => {
  const router = useRouter()
  const client = useApolloClient()
  const setNavbarTitle = useSetAtom(navbarTitleAtom)
  const [dataLoading, setDataLoading] = useState(false)
  const leftSidebarState = useSidebarLeftState()
  const autoOpenedSidebar = useRef(false)

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
        // Enable the choropleth if it wasn't manually disabled
        draft.displayOptions.dataVisualisation.showDataVisualisation = draft
          .displayOptions.dataVisualisation.showDataVisualisation || {
          [VisualisationType.Choropleth]: true,
        }
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
        updateReport((draft) => {
          draft.displayOptions.dataVisualisation.dataSourceField =
            layer.sourceData.fieldDefinitions?.[0].value
        })
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
        report,
        deleteReport,
        refreshReportData,
        updateReport,
        updateLayer,
        dataLoading,
        setDataLoading,
        removeDataSource,
        addDataSource,
      }}
    >
      {children}
    </ReportContext.Provider>
  )

  function updateReport(
    editedOutput: (draft: WritableDraft<MapReportInput>) => void,
    optimisticMutation?: OptimisticMutationUpdateMapLayers
  ) {
    const updatedReport = produce(report, editedOutput)
    if (isEqual(report, updatedReport)) return
    const input = createMapReportUpdate(updatedReport)
    const update = client.mutate<
      UpdateMapReportMutation,
      UpdateMapReportMutationVariables
    >({
      mutation: UPDATE_MAP_REPORT,
      variables: {
        input,
      },
      update: optimisticMutation,
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
        include: [
          'GetMapReport',
          'MapReportLayerAnalytics',
          'GetConstituencyData',
        ],
      }),
      {
        loading: 'Refreshing report data...',
        success: 'Report data updated',
        error: `Couldn't refresh report data`,
      }
    )
  }

  function updateLayer(
    layerId: string,
    updates: Partial<MapLayerInput>,
    optimisticMutation?: OptimisticMutationUpdateMapLayers
  ) {
    updateReport((draft) => {
      const layer = draft.layers?.find((l) => l.id === layerId)
      if (layer) {
        Object.assign(layer, updates)
      }
    }, optimisticMutation)
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
}

export default ReportProvider
export const useReport = () => useContext(ReportContext)
