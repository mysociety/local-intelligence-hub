'use client'

import { FetchResult, useApolloClient, useQuery } from '@apollo/client'
import { Provider as JotaiProvider, useAtomValue } from 'jotai'
import { merge } from 'lodash'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MapProvider } from 'react-map-gl'
import { toast } from 'sonner'
import spaceCase from 'to-space-case'

import {
  DeleteMapReportMutation,
  DeleteMapReportMutationVariables,
  GetMapReportQuery,
  GetMapReportQueryVariables,
  MapReportInput,
  UpdateMapReportMutation,
  UpdateMapReportMutationVariables,
} from '@/__generated__/graphql'
import { currentOrganisationIdAtom } from '@/lib/organisation'
import { toastPromise } from '@/lib/toast'

import ReportPage from './(components)/ReportPage'
import { ReportProvider } from './(components)/ReportProvider'
import {
  DisplayOptionsType,
  defaultDisplayOptions,
  reportContext,
} from './context'
import {
  DELETE_MAP_REPORT,
  GET_MAP_REPORT,
  UPDATE_MAP_REPORT,
} from './gql_queries'

type Params = {
  id: string
}

export default function Page({ params: { id } }: { params: Params }) {
  const router = useRouter()
  const client = useApolloClient()
  const report = useQuery<GetMapReportQuery, GetMapReportQueryVariables>(
    GET_MAP_REPORT,
    {
      variables: { id },
    }
  )
  const orgId = useAtomValue(currentOrganisationIdAtom)

  useEffect(() => {
    if (
      orgId &&
      report.data &&
      report.data.mapReport.organisation.id !== orgId
    ) {
      router.push('/reports')
    }
  }, [orgId, report, router])

  const displayOptions = merge(
    {},
    defaultDisplayOptions,
    report.data?.mapReport?.displayOptions || {}
  )

  return (
    <JotaiProvider key={id}>
      <MapProvider>
        <ReportProvider report={report}>
          <ReportPage />
        </ReportProvider>
      </MapProvider>
    </JotaiProvider>
  )
}
