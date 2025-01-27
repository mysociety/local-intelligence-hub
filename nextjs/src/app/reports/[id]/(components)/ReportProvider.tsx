'use client'

import { GetMapReportQuery } from '@/__generated__/graphql'
import { useSidebarLeftState } from '@/lib/map'
import { cleanUpLayerReferences } from '@/lib/map/displayOptionsMigrations'
import { migrateDisplayOptions } from '@/lib/map/displayOptionsMigrations/migrate'
import { refreshReportData, useReport } from '@/lib/map/useReport'
import { toastPromise } from '@/lib/toast'
import { useApolloClient } from '@apollo/client'
import { useSetAtom } from 'jotai'
import { flow, isEqual } from 'lodash'
import { ReactNode, useEffect, useRef } from 'react'
import ReportContext, { displayOptionsSchema } from '../reportContext'
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
  const report = useReport()

  // Parse the report config and merge it with the default config

  useEffect(() => {
    const updatedReport = flow([migrateDisplayOptions, cleanUpLayerReferences])(
      __unvalidatedReport
    )

    if (
      !isEqual(__unvalidatedReport.displayOptions, updatedReport.displayOptions)
    ) {
      console.log('Migrating display options')
      const update = report.updateReport((d) => {
        d.displayOptions = updatedReport.displayOptions
      })
      toastPromise(update, {
        loading: 'Updating...',
        success: 'Updated report',
        error: `Couldn't save report`,
      }).finally(() => {
        refreshReportData(client)
      })
    }
  }, [__unvalidatedReport])

  useEffect(() => {
    setNavbarTitle(__unvalidatedReport.name)
  }, [__unvalidatedReport.name])

  const leftSidebarState = useSidebarLeftState()
  const autoOpenedSidebar = useRef(false)

  useEffect(() => {
    // If there are no layers, open the left sidepanel
    if (!__unvalidatedReport.layers.length && !autoOpenedSidebar.current) {
      leftSidebarState.set(true)
      autoOpenedSidebar.current = true
    }
  }, [__unvalidatedReport.layers, autoOpenedSidebar])

  if (!__unvalidatedReport) {
    return null
  }

  const parse = displayOptionsSchema.safeParse(
    __unvalidatedReport.displayOptions
  )
  if (!parse.success) {
    return (
      <div className="overflow-auto max-w-3xl mx-auto items-center justify-center h-full text-white">
        <h1 className="text-3xl font-bold">Report error</h1>
        <p className="text-lg">This report has an invalid configuration.</p>
        <pre className="text-sm text-gray-400 mt-4">
          {JSON.stringify(parse.error, null, 2)}
        </pre>
        <pre className="text-sm text-gray-400 mt-4">
          {JSON.stringify(__unvalidatedReport.displayOptions, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <ReportContext.Provider value={{ report: __unvalidatedReport }}>
      {children}
    </ReportContext.Provider>
  )
}

export default ReportProvider
