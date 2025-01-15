'use client'

import { useQuery } from '@apollo/client'
import { Provider as JotaiProvider, useAtomValue } from 'jotai'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MapProvider } from 'react-map-gl'

import {
  GetMapReportQuery,
  GetMapReportQueryVariables,
} from '@/__generated__/graphql'
import { currentOrganisationIdAtom } from '@/lib/organisation'

import { LoadingIcon } from '@/components/ui/loadingIcon'
import { SidebarProvider } from '@/components/ui/sidebar'
import { layerEditorStateAtom, useSidebarLeftState } from '@/lib/map'
import { cloneDeep, merge } from 'lodash'
import ReportMapChoroplethLegend from './(components)/MapLayers/ReportMapChoroplethLegend'
import ReportNavbar from './(components)/ReportNavbar'
import ReportPage from './(components)/ReportPage'
import ReportProvider from './(components)/ReportProvider'
import {
  LEFT_SIDEBAR_WIDTH,
  ReportSidebarLeft,
} from './(components)/ReportSidebarLeft'
import { ReportSidebarRight } from './(components)/ReportSidebarRight'
import { GET_MAP_REPORT } from './gql_queries'
import { MapReportExtended, defaultReportConfig } from './reportContext'

type Params = {
  id: string
}

export default function Page(props: { params: Params }) {
  return (
    // Wrap the whole report tree in a Jotai provider to allow for global state
    // that does not spill over to other reports
    <JotaiProvider key={props.params.id}>
      <SelfContainedContext {...props} />
    </JotaiProvider>
  )
}

function SelfContainedContext({ params: { id } }: { params: Params }) {
  const router = useRouter()
  const report = useQuery<GetMapReportQuery, GetMapReportQueryVariables>(
    GET_MAP_REPORT,
    { variables: { id }, errorPolicy: 'all' }
  )
  const orgId = useAtomValue(currentOrganisationIdAtom)

  // TODO: Implement multi tenancy at the database level
  // TODO: Move this logic to middleware (add orgIds as a custom data array on the user's JWT)
  useEffect(() => {
    if (
      orgId &&
      report.data &&
      report.data.mapReport.organisation.id !== orgId
    ) {
      router.push('/reports')
    }
  }, [orgId, report, router])

  const leftSidebar = useSidebarLeftState()

  const layerEditorState = useAtomValue(layerEditorStateAtom)

  // Really important to check if the report is null before rendering the page
  // The ReportProvider component needs to be able to provide a report to its children
  if (!report.data?.mapReport) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="text-meepGray-400 text-2xl font-semibold -translate-y-1/2">
          <LoadingIcon />
        </div>
      </div>
    )
  }

  const mapReport = merge(
    {
      displayOptions: cloneDeep(defaultReportConfig), // prevent changing the defaults
    },
    report.data.mapReport
  ) as MapReportExtended

  return (
    <MapProvider>
      <ReportProvider report={mapReport}>
        <SidebarProvider
          style={
            {
              '--sidebar-width': `${
                layerEditorState.open
                  ? LEFT_SIDEBAR_WIDTH * 2
                  : LEFT_SIDEBAR_WIDTH
              }px`,
            } as React.CSSProperties
          }
          className="bg-meepGray-800"
          open={leftSidebar.state}
        >
          <ReportNavbar />
          <ReportSidebarLeft />
          <ReportPage />
          <span className="pointer-events-auto">
            <ReportMapChoroplethLegend />
          </span>
        </SidebarProvider>
        <ReportSidebarRight />
      </ReportProvider>
    </MapProvider>
  )
}
