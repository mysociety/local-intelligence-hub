import { StatisticsConfig } from '@/__generated__/graphql'
import { EditorSelect } from '@/app/reports/[id]/(components)/EditorSelect'
import { EditorSwitch } from '@/app/reports/[id]/(components)/EditorSwitch'
import { StatisticalDataType, ViewType } from '@/app/reports/[id]/reportContext'
import { StatisticalQueryEditor } from '@/components/report/StatisticalQueryEditor'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import { WritableDraft } from 'immer'
import { BarChart2Icon } from 'lucide-react'
import toSpaceCase from 'to-space-case'

export function PopOutChoroplethStatisticalQueryEditor({
  value,
  onChange,
}: {
  value: StatisticsConfig
  onChange: (cb: (value: WritableDraft<StatisticsConfig>) => void) => void
}) {
  const reportManager = useReport()
  const viewManager = useView(ViewType.Map)

  const fieldDefinitionValues =
    reportManager.report.layers
      .find(
        (l) =>
          l.source ===
          viewManager.currentViewOfType?.mapOptions.choropleth
            .advancedStatisticsConfig?.sourceIds?.[0]
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart2Icon className="w-4 h-4" /> Edit query
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden w-full p-0 divide-y divide-meepGray-700">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="mt-0">Edit statistical query</DialogTitle>
        </DialogHeader>
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
            value={viewManager.currentViewOfType?.mapOptions.choropleth.field}
            options={displayFieldOptions.map((value) => ({
              value: value,
              label: value,
            }))}
            onChange={(value) =>
              viewManager.updateView((draft) => {
                draft.mapOptions.choropleth.field = value
              })
            }
          />
          {viewManager.currentViewOfType?.mapOptions.choropleth.dataType ===
            StatisticalDataType.Continuous && (
            <EditorSwitch
              label="Is it a percentage?"
              value={
                !!viewManager.currentViewOfType?.mapOptions.choropleth
                  .fieldIsPercentage
              }
              onChange={(value) => {
                viewManager.updateView((draft) => {
                  draft.mapOptions.choropleth.fieldIsPercentage = value
                })
              }}
            />
          )}
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
        <StatisticalQueryEditor value={value} onChange={onChange} />
      </DialogContent>
    </Dialog>
  )
}
