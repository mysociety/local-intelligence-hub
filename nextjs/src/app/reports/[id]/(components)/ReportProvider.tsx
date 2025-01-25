'use client'

import { GetMapReportQuery } from '@/__generated__/graphql'
import { useSidebarLeftState } from '@/lib/map'
import { migrateDisplayOptions } from '@/lib/map/displayOptionsMigrations/migrate'
import { prepareMapReportForInput } from '@/lib/map/mapReportUpdate'
import { refreshReportData, updateMapReport } from '@/lib/map/useReport'
import { toastPromise } from '@/lib/toast'
import { useApolloClient } from '@apollo/client'
import { useSetAtom } from 'jotai'
import { isEqual } from 'lodash'
import { ReactNode, useEffect, useMemo, useRef } from 'react'
import toSpaceCase from 'to-space-case'
import ReportContext, { MapReportExtended } from '../reportContext'
import { navbarTitleAtom } from './ReportNavbar'

interface ReportProviderProps {
  __unvalidatedReport: GetMapReportQuery['mapReport']
  children: ReactNode
}

const ReportProvider = ({
  __unvalidatedReport,
  children,
}: ReportProviderProps) => {
  const setNavbarTitle = useSetAtom(navbarTitleAtom)
  const client = useApolloClient()

  // Parse the report config and merge it with the default config
  const { displayOptions, ...oldReport } = __unvalidatedReport
  const report = useMemo((): MapReportExtended => {
    return {
      ...oldReport,
      displayOptions: migrateDisplayOptions(__unvalidatedReport),
    }
  }, [__unvalidatedReport])

  useEffect(() => {
    if (!isEqual(displayOptions, report.displayOptions)) {
      console.log('Migrating display options')
      const input = prepareMapReportForInput(report)
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
  }, [report.name])

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

  return (
    <ReportContext.Provider value={{ report }}>
      {children}
    </ReportContext.Provider>
  )
}

export default ReportProvider
