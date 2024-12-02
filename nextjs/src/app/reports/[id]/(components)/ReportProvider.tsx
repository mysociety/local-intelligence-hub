'use client'

import { FetchResult, useApolloClient } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { ReactNode, createContext, useContext } from 'react'
import toSpaceCase from 'to-space-case'

import {
  DeleteMapReportMutation,
  DeleteMapReportMutationVariables,
  UpdateMapReportMutation,
  UpdateMapReportMutationVariables,
} from '@/__generated__/graphql'
import { toastPromise } from '@/lib/toast'

import { DELETE_MAP_REPORT, UPDATE_MAP_REPORT } from '../gql_queries'
import { ReportConfig } from '../reportContext'

interface ReportProviderProps {
  report: any
  children: ReactNode
}

const ReportProviderContext = createContext<any>(null)

const ReportProvider = ({ report, children }: ReportProviderProps) => {
  const router = useRouter()
  const client = useApolloClient()

  function updateReportConfig(reportConfig: ReportConfig) {
    const update = client.mutate<
      UpdateMapReportMutation,
      UpdateMapReportMutationVariables
    >({
      mutation: UPDATE_MAP_REPORT,
      variables: {
        input: {
          id: report.id,
          displayOptions: reportConfig,
        },
      },
    })
    toastPromise(update, {
      loading: 'Saving...',
      success: (d) => {
        return {
          title: 'Report saved',
          description: `Updated ${Object.keys(reportConfig).map(toSpaceCase).join(', ')}`,
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
        include: [
          'GetMapReport',
          'MapReportLayerAnalytics',
          'GetConstituencyData',
          'MapReportRegionStats',
          'MapReportConstituencyStats',
          'MapReportWardStats',
        ],
      }),
      {
        loading: 'Refreshing report data...',
        success: 'Report data updated',
        error: `Couldn't refresh report data`,
      }
    )
  }

  return (
    <ReportProviderContext.Provider
      value={{ report, deleteReport, refreshReportData, updateReportConfig }}
    >
      {children}
    </ReportProviderContext.Provider>
  )
}

export default ReportProvider
export const useReport = () => useContext(ReportProviderContext)
