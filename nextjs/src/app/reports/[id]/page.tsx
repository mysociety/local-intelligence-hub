'use client'

import { useQuery } from '@apollo/client'
import { Provider as JotaiProvider, useAtom, useAtomValue } from 'jotai'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { MapProvider } from 'react-map-gl'

import {
  GetMapReportQuery,
  GetMapReportQueryVariables,
} from '@/__generated__/graphql'
import { currentOrganisationIdAtom } from '@/lib/organisation'

import { LoadingIcon } from '@/components/ui/loadingIcon'
import { SidebarProvider } from '@/components/ui/sidebar'
import { layerEditorStateAtom, useSidebarLeftState } from '@/lib/map'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import MapView from './(components)/MapView'
import ReportNavbar from './(components)/ReportNavbar'
import ReportProvider from './(components)/ReportProvider'
import {
  LEFT_SIDEBAR_WIDTH,
  ReportSidebarLeft,
} from './(components)/ReportSidebarLeft'
import { ReportSidebarRight } from './(components)/ReportSidebarRight'
import { GET_MAP_REPORT } from './gql_queries'
import { ViewType } from './reportContext'

type Params = {
  id: string
}

export default function Page(props: { params: Params }) {
  return (
    // Wrap the whole report tree in a Jotai provider to allow for global state
    // that does not spill over to other reports
    <JotaiProvider key={props.params.id}>
      <QueryContext {...props} />
    </JotaiProvider>
  )
}

function QueryContext({ params: { id } }: { params: Params }) {
  const router = useRouter()

  const report = useQuery<GetMapReportQuery, GetMapReportQueryVariables>(
    GET_MAP_REPORT,
    { variables: { id }, errorPolicy: 'all' }
  )

  const rootError = report.error?.graphQLErrors.find(
    (e) => e.path && e.path.length === 1 && e.path?.[0] === 'mapReport'
  )
  const reportDoesNotExist = rootError?.message.includes(
    'matching query does not exist'
  )

  if (rootError) {
    // redirect
    if (reportDoesNotExist) {
      router.push('/reports')
      return null
    }

    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="text-meepGray-400 text-2xl font-semibold">
          {rootError.message.includes('matching query does not exist')
            ? 'Report not found'
            : 'There was a problem loading this report.'}
        </div>
      </div>
    )
  }

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

  return (
    <ReportProvider __unvalidatedReport={report.data.mapReport}>
      <LoadedReportPage {...{ params: { id } }} />
    </ReportProvider>
  )
}

function LoadedReportPage({ params: { id } }: { params: Params }) {
  const report = useReport()
  const orgId = useAtomValue(currentOrganisationIdAtom)
  const router = useRouter()

  // TODO: Implement multi tenancy at the database level
  // TODO: Move this logic to middleware (add orgIds as a custom data array on the user's JWT)
  useEffect(() => {
    if (orgId && report.report?.organisation.id !== orgId) {
      router.push('/reports')
    }
  }, [orgId, report, router])

  const leftSidebar = useSidebarLeftState()
  const [layerEditorState, setLayerEditorState] = useAtom(layerEditorStateAtom)

  const numLayers = report.report?.layers?.length ?? 0
  const prevNumLayers = useRef(numLayers)

  // Close the secondary sidebar if a layer is removed
  useEffect(() => {
    if (prevNumLayers.current > numLayers) {
      setLayerEditorState({ open: false })
    }
    prevNumLayers.current = numLayers
  }, [numLayers, setLayerEditorState])

  const view = useView()
  const mapView = useView(ViewType.Map)

  return (
    <MapProvider>
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
        {mapView.currentView ? (
          <MapView mapView={mapView.currentView} />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-meepGray-400 text-2xl font-semibold">
              {`View type "${view.currentView?.type}" not implemented`}
            </div>
            <pre>{JSON.stringify(view.currentView, null, 2)}</pre>
          </div>
        )}
      </SidebarProvider>
      <ReportSidebarRight />
    </MapProvider>
  )
}
