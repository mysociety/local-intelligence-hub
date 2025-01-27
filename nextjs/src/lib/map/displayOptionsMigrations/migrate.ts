import { GetMapReportQuery } from '@/__generated__/graphql'
import {
  MapReportWithTypedJSON,
  displayOptionsSchema,
} from '@/app/reports/[id]/reportContext'
import { migration0001 } from './migrations/0001'

const MIGRATION_FOR_VERSION_LOOKUP: Record<
  string,
  (old: GetMapReportQuery['mapReport']) => any
> = {
  FIRST: migration0001,
}

export function migrateDisplayOptions(
  oldReport: GetMapReportQuery['mapReport']
): Partial<MapReportWithTypedJSON> {
  if (!oldReport || typeof oldReport !== 'object') {
    console.log({ oldReport })
    throw new Error('Invalid display options')
  }
  if (
    !('displayOptions' in oldReport) ||
    !oldReport.displayOptions ||
    typeof oldReport.displayOptions !== 'object'
  ) {
    throw new Error('Invalid display options')
  }
  try {
    const newDisplayOptions = displayOptionsSchema
      .strict()
      .parse(oldReport.displayOptions)
    return {
      ...oldReport,
      displayOptions: newDisplayOptions,
    }
  } catch (e) {
    // Migration required
    const version = String((oldReport.displayOptions as any).version || 'FIRST')
    return MIGRATION_FOR_VERSION_LOOKUP[version]?.(oldReport)
  }
}
