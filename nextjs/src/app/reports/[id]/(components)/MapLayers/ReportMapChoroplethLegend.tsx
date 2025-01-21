import { AnalyticalAreaType } from '@/__generated__/graphql'
import { CRMSelection } from '@/components/CRMButtonItem'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import clsx from 'clsx'
import { format } from 'd3-format'
import { scaleLinear, scaleSequential } from 'd3-scale'
import { lowerCase, max, min } from 'lodash'
import { LucideChevronDown } from 'lucide-react'
import pluralize from 'pluralize'
import { useState } from 'react'
import { POLITICAL_BOUNDARIES } from '../../politicalTilesets'
import { getReportPalette } from '../../reportContext'
import useDataByBoundary from '../../useDataByBoundary'
import { EditorSelect } from '../EditorSelect'
import { useReport } from '../ReportProvider'

export default function ReportMapChoroplethLegend() {
  const { report, updateReport } = useReport()
  const [legendOpen, setLegendOpen] = useState(true)

  const {
    layers,
    displayOptions: { dataVisualisation },
  } = report
  const displayOptions = report.displayOptions

  const dataSourceId = dataVisualisation?.dataSource
  const dataSourceField = dataVisualisation?.dataSourceField
  const selectedDataSource = layers.find(
    (layer) => layer.source === dataSourceId
  )
  const boundaryType = dataVisualisation?.boundaryType

  const visibility =
    report.displayOptions?.dataVisualisation?.boundaryType === boundaryType &&
    report.displayOptions?.display?.showDataVisualisation
      ? 'visible'
      : 'none'

  const { data: dataByBoundary, loading } = useDataByBoundary({
    report,
    boundaryType,
  })

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
    return [count, colourScale(count)]
  })

  const sourceMetadata = report.layers.find(
    (layer) => layer.source === dataSourceId
  )

  if (loading) {
    return <div></div>
  }

  return (
    <div
      className={`p-4 absolute top-12 transition-all duration-300 left-0 ${visibility === 'visible' ? 'block' : 'hidden'}`}
    >
      <Collapsible
        open={legendOpen}
        onOpenChange={setLegendOpen}
        className="bg-meepGray-950 text-white rounded-md shadow-lg flex flex-col w-72 border border-meepGray-600"
      >
        <CollapsibleTrigger className="flex text-white hover:text-meepGray-200 justify-between border-meepGray-600 p-4 items-center transition-all duration-300">
          Legend
          <LucideChevronDown
            className={clsx(
              'w-5 h-5  transition-all duration-300',
              legendOpen ? 'rotate-180' : ''
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="CollapsibleContent">
          <div className="flex flex-col gap-4 p-4 border-t border-meepGray-600">
            <div className="flex flex-col gap-2">
              <EditorSelect
                label=""
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
              />
              <div className="flex flex-row items-center py-2">
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

              {/* <LegendOrdinal
          scale={ordinalScale}
          direction="row"
          itemDirection="column"
          labelMargin="6px 0 0 0"
          shapeMargin={0}
          shapeWidth={50}
          shapeHeight={10}
          className="text-meepGray-400 text-xs flex flex-col items-start"
            /> */}

              <EditorSelect
                label="Colour by"
                // explainer={`Which field from your data source will be visualised?`}
                value={dataSourceField || '__COUNT__'}
                options={[
                  {
                    label: `Count of ${lowerCase(pluralize(selectedDataSource?.sourceData.dataType || 'record', 2))}`,
                    value: '__COUNT__',
                  },
                  ...(sourceMetadata?.sourceData.fieldDefinitions
                    ?.filter(
                      // no ID fields
                      (d) => d.value !== sourceMetadata.sourceData.idField
                    )
                    .map((d) => ({
                      label: d.label,
                      value: d.value,
                    })) || []),
                ]}
                onChange={(dataSourceField) =>
                  updateReport((draft) => {
                    draft.displayOptions.dataVisualisation.dataSourceField =
                      dataSourceField
                  })
                }
                disabled={!sourceMetadata}
                disabledMessage={
                  selectedDataSource?.sourceData.dataType !== 'AREA_STATS'
                    ? `Count of ${lowerCase(pluralize(selectedDataSource?.sourceData.dataType || 'record', 2))}`
                    : undefined
                }
              />
            </div>

            <div className="flex flex-col gap-2 bg-meepGray-600  rounded-md"></div>
            {/* LegendSettings */}
            <EditorSelect
              className="-my-2"
              label="Border type"
              onChange={(d) => updateBoundaryType(d as AnalyticalAreaType)}
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

  function updateBoundaryType(boundaryType: AnalyticalAreaType) {
    updateReport((draft) => {
      draft.displayOptions.dataVisualisation.boundaryType = boundaryType
    })
  }
}
