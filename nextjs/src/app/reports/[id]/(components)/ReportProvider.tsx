'use client'

import {
  DeleteMapReportMutation,
  DeleteMapReportMutationVariables,
  Exact,
  MapLayerInput,
  MapReportInput,
  UpdateMapReportMutation,
  UpdateMapReportMutationVariables,
} from '@/__generated__/graphql'
import { useSidebarLeftState } from '@/lib/map'
import { toastPromise } from '@/lib/toast'
import {
  ApolloCache,
  DefaultContext,
  FetchResult,
  MutationUpdaterFunction,
  useApolloClient,
} from '@apollo/client'
import { produce } from 'immer'
import { useSetAtom } from 'jotai'
import { merge, pick } from 'lodash'
import { useRouter } from 'next/navigation'
import { ReactNode, useContext, useEffect, useRef, useState } from 'react'
import toSpaceCase from 'to-space-case'
import { DELETE_MAP_REPORT, UPDATE_MAP_REPORT } from '../gql_queries'
import ReportContext, {
  MapReportExtended,
  ReportConfig,
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

  useEffect(() => {
    setNavbarTitle(report.name)
  }, [report.name])

  // If the report has only one layer, set it as the data source
  useEffect(() => {
    if (
      report.layers.length === 1 &&
      !report.displayOptions?.dataVisualisation?.dataSource
    ) {
      updateReport({
        displayOptions: {
          dataVisualisation: {
            dataSource: report.layers[0].id,
          },
        },
      })
    }
  }, [report.layers])

  function updateReport(
    payload: {
      name?: string
      displayOptions?: Partial<ReportConfig>
      layers?: any[]
    },
    optimisticMutation?: OptimisticMutationUpdateMapLayers
  ) {
    const input: any = pick(merge({}, report, payload), [
      'id',
      'name',
      'displayOptions',
    ])
    if (payload.layers) {
      input.layers = payload.layers
    }

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
          description: `Updated ${Object.keys(payload).map(toSpaceCase).join(', ')}`,
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
    const nextLayers = report.layers.map((l) => ({
      id: l.id,
      name: l.name,
      source: l.source?.id,
      inspectorConfig: l.inspectorConfig,
      inspectorType: l.inspectorType,
      mapboxLayout: l.mapboxLayout,
      mapboxPaint: l.mapboxPaint,
      ...(l.id === layerId ? updates : {}),
    }))
    updateReport(
      {
        layers: nextLayers,
      },
      optimisticMutation
    )
  }

  useEffect(() => {
    // Always ensure that the choropleth has a data source
    if (
      !!report.layers.length &&
      !report.displayOptions?.dataVisualisation?.dataSource
    ) {
      updateReport(
        produce(report, (draft) => {
          draft.displayOptions.dataVisualisation.dataSource =
            report.layers[0].id
        })
      )
    }
  }, [report])

  const leftSidebarState = useSidebarLeftState()

  const autoOpenedSidebar = useRef(false)

  useEffect(() => {
    // If there are no layers, open the left sidepanel
    if (!report.layers.length && !autoOpenedSidebar.current) {
      leftSidebarState.set(true)
      autoOpenedSidebar.current = true
    }
  }, [report.layers, autoOpenedSidebar])

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
      }}
    >
      {children}
    </ReportContext.Provider>
  )
}

export default ReportProvider
export const useReport = () => useContext(ReportContext)
