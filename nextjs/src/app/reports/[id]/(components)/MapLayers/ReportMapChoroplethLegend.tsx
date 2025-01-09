import { DataSourceIcon } from '@/components/DataSourceIcon'
import { format } from 'd3-format'
import { scaleLinear, scaleSequential } from 'd3-scale'
import { max, min } from 'lodash'
import { getReportPalette } from '../../reportContext'
import useDataByBoundary from '../../useDataByBoundary'
import { useReport } from '../ReportProvider'

export default function ReportMapChoroplethLegend() {
  const { report } = useReport()

  const {
    layers,
    politicalBoundaries,
    displayOptions: { dataVisualisation },
  } = report
  const displayOptions = report.displayOptions

  const dataSourceId = dataVisualisation?.dataSource
  const dataSourceField = dataVisualisation?.dataSourceField
  const selectedDataSource = layers.find(
    (layer) => layer.source.id === dataSourceId
  )
  const boundaryType = dataVisualisation?.boundaryType

  const visibility =
    report.displayOptions?.dataVisualisation?.boundaryType === boundaryType &&
    report.displayOptions?.dataVisualisation?.showDataVisualisation?.choropleth
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

  if (loading) {
    return <div></div>
  }

  return (
    <div
      className={`p-4 absolute bottom-12 transition-all duration-300 left-0 ${visibility === 'visible' ? 'block' : 'hidden'}`}
    >
      <div className="bg-meepGray-950 text-white rounded-md p-4 shadow-lg flex flex-col gap-4">
        <div>
          <div>{dataSourceField}</div>
          <div className="text-sm flex flex-row items-center gap-1">
            <DataSourceIcon
              crmType={selectedDataSource?.source.crmType}
              className="w-4 h-4"
            />{' '}
            <span className="font-500">{selectedDataSource?.name}</span>
          </div>
        </div>
        <div className="flex flex-row items-center">
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
      </div>
    </div>
  )
}
