import { StatisticsConfigSchema } from '@/__generated__/zodSchema'
import { StatisticalQueryEditor } from '@/components/report/StatisticalQueryEditor'
import { Button } from '@/components/ui/button'
import { useActiveTileset } from '@/lib/map'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import { ReloadIcon } from '@radix-ui/react-icons'
import { produce } from 'immer'
import toSpaceCase from 'to-space-case'
import { StatisticalDataType, ViewType } from '../reportContext'
import useDataByBoundary from '../useDataByBoundary'
import { EditorSelect } from './EditorSelect'
import { EditorSwitch } from './EditorSwitch'

export default function ReportStatisticsQueryConfig() {
  const reportManager = useReport()
  const viewManager = useView(ViewType.Map)
  const activeTileset = useActiveTileset(
    viewManager.currentViewOfType?.mapOptions.choropleth.boundaryType
  )
  const { refetch: refetchChoropleth, loading } = useDataByBoundary({
    view: viewManager.currentViewOfType,
    tileset: activeTileset,
  })
  if (!viewManager || !viewManager.currentViewOfType) return null
  if (
    // No layers: no stats
    !reportManager.report.layers.length
  ) {
    return (
      <div className="flex flex-col gap-2 text-white">
        <div className="flex flex-row justify-between">
          <span className="text-md font-medium mt-2 mb-3">Statistics</span>
        </div>
        <div className="space-y-2 divide-y divide-meepGray-600">
          <span className="text-meepGray-500">No layers to query</span>
        </div>
      </div>
    )
  }

  const fieldDefinitionValues =
    reportManager.report.layers
      .find(
        (l) =>
          l.source ===
          viewManager.currentViewOfType?.mapOptions.choropleth
            .advancedStatisticsConfig?.sourceIds[0]
      )
      ?.sourceData.fieldDefinitions?.map((field) => field.value) || []

  const calculatedValues = [
    'first',
    'second',
    'third',
    'total',
    'first_label',
    'second_label',
  ]

  const userDefinedValues = (
    viewManager.currentViewOfType?.mapOptions.choropleth
      .advancedStatisticsConfig?.preGroupByCalculatedColumns || []
  )
    .concat(
      viewManager.currentViewOfType?.mapOptions.choropleth
        .advancedStatisticsConfig?.calculatedColumns || []
    )
    .map((column) => column.name)

  const displayFieldOptions = Array.from(
    new Set(
      [
        ...fieldDefinitionValues,
        ...calculatedValues,
        ...userDefinedValues,
      ].filter(Boolean)
    )
  )

  return (
    <div className="flex flex-col gap-2 text-white">
      <div className="flex flex-row justify-between px-4">
        <span className="text-md font-medium mt-2 mb-3">Statistics</span>
        <Button
          onClick={() => refetchChoropleth()}
          variant="ghost"
          className="p-0 bg-transparent ml-auto hover:bg-transparent"
          disabled={loading}
        >
          <ReloadIcon className="w-4 h-4 text-meepGray-400 hover:text-meepGray-200" />
        </Button>
      </div>

      <div className="divide-y divide-meepGray-800">
        <section className="pt-0 p-4">
          <EditorSwitch
            label={'Advanced statistics'}
            value={
              !!viewManager.currentViewOfType.mapOptions.choropleth
                .useAdvancedStatistics
            }
            onChange={(value) => {
              viewManager.updateView((draft) => {
                draft.mapOptions.choropleth.useAdvancedStatistics = value
                if (draft.mapOptions.choropleth.useAdvancedStatistics) {
                  draft.mapOptions.choropleth.advancedStatisticsConfig =
                    StatisticsConfigSchema().parse({
                      sourceIds: [reportManager.report.layers[0].source],
                      ...(draft.mapOptions.choropleth
                        .advancedStatisticsConfig || {}),
                    })
                }
              })
            }}
          />
        </section>
        <section className="space-y-5 p-4">
          <h3 className="text-md font-medium">Display options</h3>
          {/* aggregation_operation: Optional[stats.AggregationOp] = None */}
          <EditorSelect
            label="Type of data to display"
            value={
              viewManager.currentViewOfType?.mapOptions.choropleth.dataType
            }
            options={Object.values(StatisticalDataType).map((value) => ({
              value: value,
              label: toSpaceCase(value),
            }))}
            onChange={(value) =>
              viewManager.updateView((draft) => {
                draft.mapOptions.choropleth.dataType =
                  value as StatisticalDataType
              })
            }
          />
          <EditorSelect
            label="Display field"
            value={
              viewManager.currentViewOfType?.mapOptions.choropleth
                .advancedStatisticsDisplayField
            }
            options={displayFieldOptions.map((value) => ({
              value: value,
              label: value,
            }))}
            onChange={(value) =>
              viewManager.updateView((draft) => {
                draft.mapOptions.choropleth.advancedStatisticsDisplayField =
                  value
              })
            }
          />
          {viewManager.currentViewOfType?.mapOptions.choropleth.dataType ===
            StatisticalDataType.Nominal && (
            <EditorSwitch
              label="Are these electoral parties?"
              value={
                !!viewManager.currentViewOfType.mapOptions.choropleth
                  .isElectoral
              }
              onChange={(value) => {
                viewManager.updateView((draft) => {
                  draft.mapOptions.choropleth.isElectoral = value
                })
              }}
            />
          )}
        </section>
        <StatisticalQueryEditor
          value={
            viewManager.currentViewOfType?.mapOptions.choropleth
              .advancedStatisticsConfig ||
            StatisticsConfigSchema().parse({
              sourceIds: [reportManager.report.layers[0].source],
            })
          }
          onChange={(cb) =>
            viewManager.updateView((draft) => {
              draft.mapOptions.choropleth.advancedStatisticsConfig = produce(
                draft.mapOptions.choropleth.advancedStatisticsConfig,
                cb
              )
            })
          }
        />
      </div>
    </div>
  )
}
