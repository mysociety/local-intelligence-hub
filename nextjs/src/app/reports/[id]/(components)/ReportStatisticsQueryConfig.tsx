import {
  AggregationOp,
  AreaQueryMode,
  CalculatedColumn,
} from '@/__generated__/graphql'
import { StatisticsConfigSchema } from '@/__generated__/zodSchema'
import { CRMSelection } from '@/components/CRMButtonItem'
import { Button } from '@/components/ui/button'
import { useActiveTileset } from '@/lib/map'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import { ReloadIcon } from '@radix-ui/react-icons'
import { cloneDeep, isEqual } from 'lodash'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { twMerge } from 'tailwind-merge'
import toSpaceCase from 'to-space-case'
import { v4 } from 'uuid'
import { ViewType } from '../reportContext'
import useDataByBoundary from '../useDataByBoundary'
import { EditorSelect } from './EditorSelect'
import { EditorSwitch } from './EditorSwitch'
import { EditorTextInput } from './EditorTextInput'

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
        {!!viewManager.currentViewOfType!.mapOptions.choropleth
          .useAdvancedStatistics && (
          <>
            {/* # Querying */}
            <section className="space-y-5 p-4">
              <h3 className="text-md font-medium">Querying</h3>
              <EditorSelect
                value={
                  viewManager.currentViewOfType?.mapOptions.choropleth
                    .advancedStatisticsConfig?.sourceIds[0]
                }
                className={'w-full'}
                options={reportManager.report.layers.map((layer) => ({
                  value: layer.source,
                  label: (
                    <CRMSelection
                      source={layer.sourceData}
                      displayCount={false}
                      className="truncate"
                    />
                  ),
                }))}
                onChange={(layerId) =>
                  viewManager.updateView((draft) => {
                    draft.mapOptions.choropleth.advancedStatisticsConfig!.sourceIds =
                      [layerId]
                  })
                }
                valueClassName={twMerge(
                  !viewManager.currentViewOfType?.mapOptions.display.choropleth
                    ? '!text-meepGray-500'
                    : ''
                )}
              />
              {/* gss_codes: Optional[List[str]] = None */}
              <EditorSelect
                label={'Fetch data for'}
                value={
                  viewManager.currentViewOfType?.mapOptions.choropleth
                    .advancedStatisticsConfig?.areaQueryMode
                }
                options={Object.entries(AreaQueryMode).map(([key, value]) => ({
                  value: value,
                  label: toSpaceCase(value),
                }))}
                onChange={(value) => {
                  viewManager.updateView((draft) => {
                    draft.mapOptions.choropleth.advancedStatisticsConfig!.areaQueryMode =
                      value as AreaQueryMode
                  })
                }}
              />
              {/* map_bounds: Optional[stats.MapBounds] = None */}
            </section>
            {/* # Grouping */}
            {/* Something for the table view */}
            {/* <section className='p-4'> */}
            {/* <h3 className="text-md font-medium">Grouping</h3> */}
            {/* group_by_area: Optional[AnalyticalAreaType] = None */}
            {/* group_by_columns: Optional[List[stats.GroupByColumn]] = None */}
            {/* </section> */}
            {/* # Values */}
            <section className="space-y-5 p-4">
              <h3 className="text-md font-medium">
                Pre-group-by calculated columns
              </h3>
              {/* pre_group_by_calculated_columns: Optional[List[stats.CalculatedColumn]] = None */}
              {viewManager.currentViewOfType?.mapOptions.choropleth.advancedStatisticsConfig?.preGroupByCalculatedColumns?.map(
                (column, index) => (
                  <FormulaEditor
                    key={column.id}
                    column={column}
                    onSave={(column) => {
                      viewManager.updateView((draft) => {
                        const index =
                          draft.mapOptions.choropleth.advancedStatisticsConfig?.preGroupByCalculatedColumns?.findIndex(
                            (c) => c.id === column.id
                          )
                        if (index === undefined || index === -1) return
                        draft.mapOptions.choropleth.advancedStatisticsConfig!.preGroupByCalculatedColumns![
                          index
                        ] = column
                      })
                    }}
                    onDelete={(column) => {
                      viewManager.updateView((draft) => {
                        const index =
                          draft.mapOptions.choropleth.advancedStatisticsConfig?.preGroupByCalculatedColumns?.findIndex(
                            (c) => c.id === column.id
                          )
                        if (index === undefined || index === -1) return
                        draft.mapOptions.choropleth.advancedStatisticsConfig!.preGroupByCalculatedColumns?.splice(
                          index,
                          1
                        )
                      })
                    }}
                  />
                )
              )}
              <Button
                size="sm"
                onClick={() => {
                  viewManager.updateView((draft) => {
                    if (!draft.mapOptions.choropleth.advancedStatisticsConfig)
                      return
                    if (
                      !draft.mapOptions.choropleth.advancedStatisticsConfig
                        .preGroupByCalculatedColumns
                    ) {
                      draft.mapOptions.choropleth.advancedStatisticsConfig.preGroupByCalculatedColumns =
                        []
                    }
                    draft.mapOptions.choropleth.advancedStatisticsConfig.preGroupByCalculatedColumns!.push(
                      {
                        id: v4(),
                        name: '',
                        expression: '',
                        aggregationOperation: AggregationOp.Sum,
                        isPercentage: false,
                      }
                    )
                  })
                }}
              >
                Add
              </Button>
            </section>
            <section className="space-y-5 p-4">
              <h3 className="text-md font-medium">Calculated columns</h3>
              {viewManager.currentViewOfType?.mapOptions.choropleth.advancedStatisticsConfig?.calculatedColumns?.map(
                (column, index) => (
                  <FormulaEditor
                    key={column.id}
                    column={column}
                    onSave={(column) => {
                      viewManager.updateView((draft) => {
                        const index =
                          draft.mapOptions.choropleth.advancedStatisticsConfig?.calculatedColumns?.findIndex(
                            (c) => c.id === column.id
                          )
                        console.log(
                          'index',
                          index,
                          column.id,
                          cloneDeep(
                            draft.mapOptions.choropleth.advancedStatisticsConfig
                              ?.calculatedColumns || []
                          )
                        )
                        if (index === undefined || index === -1) return
                        draft.mapOptions.choropleth.advancedStatisticsConfig!.calculatedColumns![
                          index
                        ] = column
                      })
                    }}
                    onDelete={(column) => {
                      viewManager.updateView((draft) => {
                        const index =
                          draft.mapOptions.choropleth.advancedStatisticsConfig?.calculatedColumns?.findIndex(
                            (c) => c.id === column.id
                          )
                        if (index === undefined || index === -1) return
                        draft.mapOptions.choropleth.advancedStatisticsConfig!.calculatedColumns?.splice(
                          index,
                          1
                        )
                      })
                    }}
                  />
                )
              )}
              <Button
                size="sm"
                onClick={() => {
                  viewManager.updateView((draft) => {
                    if (!draft.mapOptions.choropleth.advancedStatisticsConfig)
                      return
                    if (
                      !draft.mapOptions.choropleth.advancedStatisticsConfig
                        .calculatedColumns
                    ) {
                      draft.mapOptions.choropleth.advancedStatisticsConfig.calculatedColumns =
                        []
                    }
                    draft.mapOptions.choropleth.advancedStatisticsConfig.calculatedColumns!.push(
                      {
                        id: v4(),
                        name: '',
                        expression: '',
                        aggregationOperation: AggregationOp.Sum,
                        isPercentage: false,
                      }
                    )
                  })
                }}
              >
                Add
              </Button>
            </section>
            <section className="space-y-5 p-4">
              <h3 className="text-md font-medium">Values</h3>
              {/* aggregation_operation: Optional[stats.AggregationOp] = None */}
              <EditorSelect
                label="Aggregation operation"
                value={
                  viewManager.currentViewOfType?.mapOptions.choropleth
                    .advancedStatisticsConfig?.aggregationOperation
                }
                options={Object.values(AggregationOp).map((value) => ({
                  value: value,
                  label: toSpaceCase(value),
                }))}
                onChange={(value) =>
                  viewManager.updateView((draft) => {
                    draft.mapOptions.choropleth.advancedStatisticsConfig!.aggregationOperation =
                      value as AggregationOp
                  })
                }
              />
              {/* aggregation_operations: Optional[List[stats.AggregationDefinition]] = None */}
              {/* return_columns: Optional[List[str]] = None */}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function FormulaEditor({
  column,
  onSave,
  onDelete,
}: {
  column: CalculatedColumn
  onSave: (c: CalculatedColumn) => void
  onDelete: (c: CalculatedColumn) => void
}) {
  const viewManager = useView(ViewType.Map)
  const defaultValues = useMemo(() => {
    return {
      id: column.id,
      name: column.name,
      expression: column.expression,
      aggregationOperation: column.aggregationOperation,
      isPercentage: column.isPercentage,
    }
  }, [column])
  const form = useForm({
    defaultValues,
    values: defaultValues,
  })
  const values = form.watch()
  const unsavedChanges =
    !isEqual(defaultValues, values) || form.formState.isDirty
  if (!viewManager || !viewManager.currentViewOfType) return null
  return (
    <div className="p-2 pt-3 border border-meepGray-700 rounded-md relative">
      <div className="uppercase text-xs text-meepGray-400 -top-2 px-1 absolute bg-meepGray-600 inline-block">
        Calculated column
      </div>
      <EditorTextInput
        label="Variable name"
        className="text-xs h-6"
        value={values.name}
        onChange={(e) => form.setValue('name', e.target.value)}
      />
      {/* Expression */}
      <EditorTextInput
        label="Formula"
        className="text-xs h-6"
        value={values.expression}
        onChange={(e) => form.setValue('expression', e.target.value)}
      />
      {/* Aggregation operation */}
      <EditorSelect
        label="Aggregation op"
        // labelClassName="w-1/2 shrink-0"
        options={Object.values(AggregationOp).map((value) => ({
          value: value,
          label: toSpaceCase(value),
        }))}
        value={values.aggregationOperation}
        onChange={(str) => {
          form.setValue('aggregationOperation', str as AggregationOp)
        }}
      />
      <EditorSwitch
        label="Is percentage"
        value={!!column.isPercentage}
        onChange={(value) => {
          form.setValue('isPercentage', !!value)
        }}
      />
      {/* DELETE */}
      <div className="flex flex-row justify-between gap-2">
        <Button
          onClick={() => {
            onSave(form.getValues())
            form.reset()
          }}
          variant={'ghost'}
          className={twMerge(
            'p-0 font-semibold',
            unsavedChanges ? 'text-green-500' : 'text-meepGray-400'
          )}
          size={'sm'}
        >
          Save {unsavedChanges ? 'changes' : ''}
        </Button>
        {/* Reset */}
        {!!unsavedChanges && (
          <Button
            onClick={() => form.reset()}
            variant={'ghost'}
            className="text-meepGray-400 p-0"
            size={'sm'}
          >
            Reset
          </Button>
        )}
        <Button
          onClick={() => onDelete(column)}
          variant={'ghost'}
          className="text-red-700 p-0"
          size={'sm'}
        >
          Remove
        </Button>
      </div>
    </div>
  )
}
