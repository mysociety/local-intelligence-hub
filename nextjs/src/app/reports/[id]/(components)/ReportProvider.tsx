'use client'

import { GetMapReportQuery } from '@/__generated__/graphql'
import { useSidebarLeftState } from '@/lib/map'
import { useSetAtom } from 'jotai'
import { ReactNode, useEffect, useMemo, useRef } from 'react'
import ReportContext, { displayOptionsSchema } from '../reportContext'
import { navbarTitleAtom } from './ReportNavbar'

interface ReportProviderProps {
  __unvalidatedReport: GetMapReportQuery['mapReport']
  children: ReactNode
}

const ReportProvider = ({
  __unvalidatedReport: { displayOptions, ...__report },
  children,
}: ReportProviderProps) => {
  const setNavbarTitle = useSetAtom(navbarTitleAtom)

  // Parse the report config and merge it with the default config
  const parsed = useMemo(() => {
    return displayOptionsSchema.strict().parse(displayOptions)
  }, [displayOptions])

  const report = {
    ...__report,
    displayOptions: parsed,
  }

  useEffect(() => {
    setNavbarTitle(report.name)
  }, [report.name])

  const leftSidebarState = useSidebarLeftState()
  const autoOpenedSidebar = useRef(false)

  useEffect(() => {
    // If there are no layers, open the left sidepanel
    if (!report.layers.length && !autoOpenedSidebar.current) {
      leftSidebarState.set(true)
      autoOpenedSidebar.current = true
    }
  }, [report.layers, autoOpenedSidebar])

  return <pre>{JSON.stringify(parsed, null, 2)}</pre>

  return (
    <ReportContext.Provider value={{ report }}>
      {children}
    </ReportContext.Provider>
  )
}

export default ReportProvider
