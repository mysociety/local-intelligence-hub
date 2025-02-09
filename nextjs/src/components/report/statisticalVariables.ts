import { StatisticsConfig } from '@/__generated__/graphql'
import { useReport } from '@/lib/map/useReport'

export function useStatisticalVariables(statsConfig: StatisticsConfig) {
  const reportManager = useReport()

  const dataSourceFields =
    reportManager.report.layers
      .find((l) => l.source === statsConfig.sourceIds?.[0])
      ?.sourceData.fieldDefinitions?.map((field) => field.value) || []

  const calculatedValues = [
    'first',
    'second',
    'third',
    'total',
    'first_label',
    'second_label',
  ]

  const userDefinedValues = (statsConfig?.preGroupByCalculatedColumns || [])
    .concat(statsConfig?.calculatedColumns || [])
    .map((column) => column.name)

  const all = Array.from(
    new Set(
      [...dataSourceFields, ...calculatedValues, ...userDefinedValues].filter(
        Boolean
      )
    )
  )

  return {
    all,
    dataSourceFields,
    calculatedValues,
    userDefinedValues,
  }
}
