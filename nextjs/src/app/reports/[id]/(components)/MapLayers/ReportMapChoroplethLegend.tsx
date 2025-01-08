import { LegendThreshold } from '@visx/legend'
import { scaleThreshold } from '@visx/scale'
import useDataByBoundary from '../../useDataByBoundary'
import { useReport } from '../ReportProvider'

export default function ReportMapChoroplethLegend() {
  const { report } = useReport()

  const {
    layers,
    politicalBoundaries,
    displayOptions: { dataVisualisation },
  } = report

  const dataSourceId = dataVisualisation?.dataSource
  const dataSourceField = dataVisualisation?.dataSourceField
  const selectedDataSource = layers.find((layer) => layer.id === dataSourceId)
  const selectedBoundaryLabel = politicalBoundaries.find(
    (boundary) => boundary.boundaryType === dataVisualisation?.boundaryType
  )?.label
  const color = dataVisualisation?.palette
  const boundaryType = dataVisualisation?.boundaryType

  const visibility =
    report.displayOptions?.dataVisualisation?.boundaryType === boundaryType &&
    report.displayOptions?.dataVisualisation?.showDataVisualisation?.choropleth
      ? 'visible'
      : 'none'

  const { data: dataByBoundary } = useDataByBoundary({ report, boundaryType })
  // Get min and max counts
  const minCount = Math.min(
    ...dataByBoundary.map((d) => d.count || 0).filter((count) => count > 0)
  )
  const maxCount = Math.max(...dataByBoundary.map((d) => d.count))

  // Create array of 5 evenly spaced values
  const step = (maxCount - minCount) / 4
  const domain = [
    minCount,
    minCount + step,
    minCount + 2 * step,
    minCount + 3 * step,
    maxCount,
  ]

  //Legend scale
  const thresholdScale = scaleThreshold({
    domain,
    range: ['#CCEEF7', '#99DCEE', '#66CBE6', '#33BBE0', '#00A8D5'],
  })
  const legendGlyphSize = 14

  return (
    <div
      className={`p-4 absolute bottom-10 transition-all duration-300 -z-10 ${visibility === 'visible' ? 'left-full' : '-left-[200%]'}`}
    >
      <div className="bg-meepGray-950 text-white rounded-md p-4 shadow-lg flex flex-col gap-4">
        <p>{selectedDataSource?.name}</p>

        <LegendThreshold
          scale={thresholdScale}
          direction="row"
          itemDirection="column"
          labelMargin="6px 20px 0 0"
          shapeMargin={0}
          labelAlign="end"
          shapeWidth={70}
          shapeHeight={10}
          labelDelimiter="-"
          className="text-meepGray-400 text-xs flex flex-col items-start"
        ></LegendThreshold>
      </div>
    </div>
  )
}
