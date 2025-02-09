import { GetMapReportQuery } from '@/__generated__/graphql'
import {
  DisplayOptionsVersion,
  MapReportWithTypedJSON,
  displayOptionsSchema,
} from '@/app/reports/[id]/reportContext'
import { produce } from 'immer'
import migration0001 from './migrations/0001'
import migration0002 from './migrations/0002'

const MIGRATION_FOR_VERSION_LOOKUP: Record<
  keyof typeof DisplayOptionsVersion,
  ((old: GetMapReportQuery['mapReport']) => any) | null
> = {
  FIRST: migration0001,
  '20250125': migration0002,
  '2025-01-25': migration0002,
  '2025-02-08': null,
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
      let version: keyof typeof DisplayOptionsVersion =
        unmigratedReport.displayOptions.version || DisplayOptionsVersion.FIRST
      console.log(`Report is version ${version}.`)
      let nextMigration = MIGRATION_FOR_VERSION_LOOKUP[version]
      while (nextMigration) {
        console.log(`Migrating display options from ${version}.`)
        // Do it
        draft.displayOptions = nextMigration(draft).displayOptions
        console.log(
          `Display options migrated to ${draft.displayOptions.version}.`
        )
        version = draft.displayOptions.version || DisplayOptionsVersion.FIRST
        nextMigration = MIGRATION_FOR_VERSION_LOOKUP[version]
      }
    }
  })
}
