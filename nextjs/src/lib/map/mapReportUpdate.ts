import { MapReportInput } from '@/__generated__/graphql'
import { MapReportExtended } from '@/app/reports/[id]/reportContext'
import { omit } from 'lodash'
import omitDeep from 'omit-deep-lodash'

export function createMapReportUpdate(
  report: MapReportExtended | MapReportInput
): MapReportInput {
  report = omit(report, ['organisation'])
  // Remove isSharedSource, sharingPermission, sourceData from layers
  // @ts-ignore
  report.layers = (report.layers || []).map((layer) =>
    omit(layer, ['isSharedSource', 'sharingPermission', 'sourceData'])
  )
  // Go through every key and remove graphql gubbins like __typename
  report = omitDeep(report, ['__typename'])
  return report as MapReportInput
}
