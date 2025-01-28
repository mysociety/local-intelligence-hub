import { GetMapReportQuery } from '@/__generated__/graphql'
import {
  MapReportWithTypedJSON,
  displayOptionsSchema,
} from '@/app/reports/[id]/reportContext'
import { produce } from 'immer'
import { migration0001 } from './migrations/0001'

const MIGRATION_FOR_VERSION_LOOKUP: Record<
  string,
  (old: GetMapReportQuery['mapReport']) => any
> = {
  FIRST: migration0001,
}

export function migrateDisplayOptions(
  maybeUnmigratedReport: GetMapReportQuery['mapReport']
): MapReportWithTypedJSON {
  return produce(maybeUnmigratedReport, (draft) => {
    if (!maybeUnmigratedReport || typeof maybeUnmigratedReport !== 'object') {
      console.log({ maybeUnmigratedReport })
      throw new Error('Invalid report')
    }
    try {
      // First try parsing. If it works straightforwardly, no migrations are required.
      const newDisplayOptions = displayOptionsSchema
        .strict()
        .parse(maybeUnmigratedReport.displayOptions || {})
      draft.displayOptions = newDisplayOptions
    } catch (e) {
      const unmigratedReport = maybeUnmigratedReport
      // If the parser fails, then a migration required. Look at the version for clues as to which patch to apply.
      const version = String(
        (unmigratedReport.displayOptions as any).version || 'FIRST'
      )
      draft = MIGRATION_FOR_VERSION_LOOKUP[version]?.(unmigratedReport)
    }
  })
}
