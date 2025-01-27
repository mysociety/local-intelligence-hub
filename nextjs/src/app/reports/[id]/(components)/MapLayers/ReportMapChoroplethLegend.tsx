import { ChoroplethMode, DataSummaryMetadata } from '@/__generated__/graphql'
import { CRMSelection } from '@/components/CRMButtonItem'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useActiveTileset } from '@/lib/map'
import clsx from 'clsx'
import { format } from 'd3-format'
import { scaleLinear, scaleSequential } from 'd3-scale'
import { lowerCase, max, min } from 'lodash'
import { LucideChevronDown, PaintBucket, Radical } from 'lucide-react'
import pluralize from 'pluralize'
import { useState } from 'react'
import { BoundaryType, POLITICAL_BOUNDARIES } from '../../politicalTilesets'
import { PALETTE, getReportPalette } from '../../reportContext'
import useDataByBoundary from '../../useDataByBoundary'
import { EditorSelect } from '../EditorSelect'
import { useReport } from '../ReportProvider'

export default function ReportMapChoroplethLegend() {
  const { report, updateReport } = useReport()
  const [legendOpen, setLegendOpen] = useState(true)
  const [formulaSet, setFormulaSet] = useState(false)
  const {
    layers,
    displayOptions: { dataVisualisation },
  } = report
  const displayOptions = report.displayOptions

  const dataSourceId = dataVisualisation?.dataSource
  const dataSourceField = dataVisualisation?.dataSourceField
  const formula = dataVisualisation?.formula
  const selectedDataSource = layers.find(
    (layer) => layer.source === dataSourceId
  )
  const boundaryType = dataVisualisation?.boundaryType
  const choroplethMode = dataVisualisation?.choroplethMode
  const [selectedChoroplethMode, setSelectedChoroplethMode] = useState(
    ChoroplethMode.Count
  )

  const visibility =
    report.displayOptions?.dataVisualisation?.boundaryType === boundaryType &&
    report.displayOptions?.display?.showDataVisualisation
      ? 'visible'
      : 'none'

  const activeTileset = useActiveTileset(boundaryType)

  const { loading, data } = useDataByBoundary({
    report,
    tileset: activeTileset,
  })
  const dataByBoundary = data?.choroplethDataForSource || []

  // Get min and max counts
  let minCount = min(dataByBoundary.map((d) => d.count || 0)) || 0
  let maxCount = max(dataByBoundary.map((d) => d.count || 0)) || 1

  //
  const difference = maxCount - minCount
  let isPercentage = false
  let formatStr = ',.2r'
  if (difference < 2) {
    formatStr = '.0%'
    isPercentage = true
  }

  // ensure minCount and maxCount are different
  if (minCount === maxCount) {
    if (minCount >= 1) {
      minCount = minCount - 0.1
    } else {
      maxCount = maxCount + 0.1
    }
  }

  const interpolator = getReportPalette(displayOptions)

  // Legend scale
  const colourScale = scaleSequential()
    .domain([minCount, maxCount])
    .interpolator(interpolator)

  // Define 30 stops of colour
  let steps = isPercentage ? 5 : 7

  // Now turn each i into an associated number in the range min-max:
  const stepsToDomainTransformer = scaleLinear()
    .domain([0, steps])
    .range([minCount, maxCount])

  const colourStops = new Array(steps).fill(0).map((_, step) => {
    const count = stepsToDomainTransformer(step)
    return [count, colourScale(count)] as [number, string]
  })

  const sourceMetadata = report.layers.find(
    (layer) => layer.source === dataSourceId
  )

  if (loading) {
    return <div></div>
  }

  return (
    <div
      className={`p-4 absolute top-12 transition-all duration-300 left-0  ${visibility === 'visible' ? 'block' : 'hidden'}`}
    >
      <Collapsible
        open={legendOpen}
        onOpenChange={setLegendOpen}
        className={clsx(
          ' bg-[#1f2229]/90 text-white rounded-md shadow-lg flex flex-col border border-meepGray-600 backdrop-blur-[5px]',
          legendOpen ? 'w-72' : 'w-auto'
        )}
      >
        <CollapsibleTrigger className="flex gap-2 text-white hover:text-meepGray-200 justify-between border-meepGray-600 p-4 items-center transition-all duration-300">
          Legend
          <LucideChevronDown
            className={clsx(
              'w-5 h-5  transition-all duration-300',
              legendOpen ? 'rotate-180' : ''
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="CollapsibleContent ">
          <div className="flex w-full gap-4 p-4 border-t border-meepGray-600">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-row items-center gap-2 ">
                <EditorSelect
                  // explainer={`Select which data will populate your ${selectedBoundaryLabel}`}
                  value={dataSourceId}
                  options={layers.map((layer) => ({
                    label: (
                      <CRMSelection
                        source={layer.sourceData}
                        displayCount={false}
                        className=" truncate"
                      />
                    ),
                    value: layer.source,
                  }))}
                  onChange={(dataSource) =>
                    updateReport((draft) => {
                      draft.displayOptions.dataVisualisation.dataSource =
                        dataSource
                    })
                  }
                  className="w-full"
                />
                <Separator orientation="vertical" />

                <EditorSelect
                  icon={
                    <PaintBucket className="w-5 h-5 stroke text-meepGray-400 hover:text-meepGray-100" />
                  }
                  // explainer={`Select the boundary type to visualise your data`}
                  value={dataVisualisation?.palette}
                  options={Object.entries(PALETTE).map(([value, res]) => ({
                    label: res.label,
                    value,
                    // TODO: display the palette
                  }))}
                  onChange={(palette) =>
                    updateReport((draft) => {
                      draft.displayOptions.dataVisualisation.palette =
                        palette as keyof typeof PALETTE
                    })
                  }
                />
              </div>
              <ColourStops colourStops={colourStops} formatStr={formatStr} />

              <DisplayingSection
                formulaSet={formulaSet}
                dataSourceField={dataSourceField || ''}
                setFormulaSet={setFormulaSet}
                choroplethMode={choroplethMode}
                sourceMetadata={sourceMetadata}
                selectedDataSource={selectedDataSource}
              />
              {choroplethMode === ChoroplethMode.Formula && (
                <FormulaConfig
                  setFormulaSet={setFormulaSet}
                  sourceMetadata={sourceMetadata}
                  formula={formula || ''}
                />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 bg-meepGray-600   p-4">
            {/* LegendSettings */}
            <p className="text-sm font-mono uppercase text-meepGray-400">
              Map political boundary
            </p>
            <EditorSelect
              className="-my-2"
              onChange={(d) => updateBoundaryType(d as BoundaryType)}
              value={dataVisualisation?.boundaryType}
              options={POLITICAL_BOUNDARIES.map((boundary) => ({
                label: boundary.label,
                value: boundary.boundaryType,
              }))}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )

  function updateBoundaryType(boundaryType: BoundaryType) {
    updateReport((draft) => {
      draft.displayOptions.dataVisualisation.boundaryType = boundaryType
    })
  }
}

function ColourStops({
  colourStops,
  formatStr,
}: {
  colourStops: [number, string][]
  formatStr: string
}) {
  return (
    <div className="flex flex-col  items-center justify-center">
      <div className="flex flex-row items-center py-1 w-full">
        {colourStops.map((stop, i) => {
          return (
            <div
              key={i}
              className="basis-0 min-w-0 flex-shrink-0 grow flex flex-col"
            >
              <div
                className="h-4"
                style={{
                  backgroundColor: String(stop[1]),
                }}
              ></div>
              <div className="text-xs text-center px-2">
                {format(formatStr)(Number(stop[0]))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
function DisplayingSection({
  formulaSet,
  dataSourceField,
  setFormulaSet,

  choroplethMode,
  sourceMetadata,
  selectedDataSource,
}: {
  formulaSet: boolean
  dataSourceField: string
  setFormulaSet: (set: boolean) => void

  choroplethMode: ChoroplethMode
  sourceMetadata: any
  selectedDataSource: any
}) {
  const { report, updateReport } = useReport()
  const displayConfig = [
    {
      value: ChoroplethMode.Count,
      content: null,
    },
    {
      value: ChoroplethMode.Field,
      content: (
        <>
          <div className="flex flex-row items-center gap-1 text-xs text-center px-3  bg-meepGray-600 rounded-full">
            <EditorSelect
              // explainer={`Which field from your data source will be visualised?`}
              value={dataSourceField}
              options={[
                {
                  label: `Count of ${lowerCase(pluralize(selectedDataSource?.sourceData.dataType || 'record', 2))}`,
                  value: '__COUNT__',
                },
                ...(sourceMetadata?.sourceData.fieldDefinitions
                  ?.filter(
                    // no ID fields
                    (d: any) => d.value !== sourceMetadata.sourceData.idField
                  )
                  .map((d: any) => ({
                    label: d.label,
                    value: d.value,
                  })) || []),
              ]}
              onChange={(dataSourceField) => {
                updateReport((draft) => {
                  draft.displayOptions.dataVisualisation.dataSourceField =
                    dataSourceField
                })
                setFormulaSet(false)
              }}
              disabled={!sourceMetadata}
              disabledMessage={
                selectedDataSource?.sourceData.dataType !== 'AREA_STATS'
                  ? `Count of ${lowerCase(pluralize(selectedDataSource?.sourceData.dataType || 'record', 2))}`
                  : undefined
              }
            />
          </div>
        </>
      ),
    },
    {
      value: ChoroplethMode.Formula,
      content: null,
    },
  ]

  return (
    <div className="flex flex-row justify-center items-center gap-1 text-xs font-mono text-meepGray-200 ">
      <div className="flex flex-col items-center gap-1 text-xs text-center px-2">
        <EditorSelect
          label="Displaying"
          value={choroplethMode}
          options={Object.keys(ChoroplethMode).map((value) => ({
            label: value,
            value,
          }))}
          onChange={(option) => {
            console.log('option', option)
            if (
              option === ChoroplethMode.Count ||
              option === ChoroplethMode.Field
            ) {
              updateReport((draft) => {
                draft.displayOptions.dataVisualisation.dataSourceField =
                  '__COUNT__'
                draft.displayOptions.dataVisualisation.choroplethMode =
                  option as ChoroplethMode
              })
            } else {
              updateReport((draft) => {
                draft.displayOptions.dataVisualisation.choroplethMode =
                  option as ChoroplethMode
              })
            }
          }}
        />
        {displayConfig.find((d) => d.value === choroplethMode)?.content}
      </div>
    </div>
  )
}

function FormulaConfig({
  formula,
  sourceMetadata,
  setFormulaSet,
}: {
  formula: string
  sourceMetadata: any
  setFormulaSet: (set: boolean) => void
}) {
  const [inputText, setInputText] = useState(formula)
  const { report, updateReport } = useReport()

  const editingEmpty = !inputText
  const [editing, setEditing] = useState(editingEmpty)

  function handleVariableInsert(variable: string) {
    setInputText((prev) => prev + `${variable}`)
  }

  function handleSave() {
    if (editing) {
      setFormulaSet(true)
      setEditing(false)
      updateReport((draft) => {
        draft.displayOptions.dataVisualisation.formula = inputText
      })
    } else {
      setEditing(true)
    }
  }

  //hardcoded fields for now
  const metadataFields: {
    label: string
    value: keyof DataSummaryMetadata
  }[] = [
    { label: 'First', value: 'first' },
    { label: 'Second', value: 'second' },
    { label: 'Third', value: 'third' },
    { label: 'Last', value: 'last' },
    { label: 'Total', value: 'total' },
    { label: 'Count', value: 'count' },
    { label: 'Mean', value: 'mean' },
    { label: 'Median', value: 'median' },
  ]

  return (
    <div className=" text-xs font-mono text-meepGray-400 w-full flex flex-col gap-2 border-t border-meepGray-600 mt-2">
      <div className="flex items-center gap-1 pt-1">
        <Radical className="w-3 h-3" />
        Custom Formula
        <Separator orientation="vertical" className="ml-2" />
        <div onClick={handleSave} className="p-1 cursor-pointer ">
          {editing ? (
            <p className="text-xs font-mono text-green-600 hover:text-green-500">
              Save
            </p>
          ) : (
            <p className="text-xs font-mono text-orange-400 hover:text-orange-500">
              Edit
            </p>
          )}
        </div>
      </div>
      <Textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="bg-meepGray-800 rounded font-mono text-meepGray-200"
        disabled={!editing}
      />
      <div className="flex flex-col gap-2 ">
        {editing && (
          <>
            <p className="text-xs font-mono text-meepGray-400">
              Available variables
            </p>
            <div className="flex flex-wrap gap-1 w-full">
              {metadataFields.map((variable) => (
                <Button
                  key={variable.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleVariableInsert(variable.value)}
                  className="shrink-0"
                >
                  {variable.label}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
