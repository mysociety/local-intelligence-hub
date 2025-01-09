import { DataSourceIcon } from '@/components/DataSourceIcon'
import { LegendOrdinal } from '@visx/legend'
import { scaleOrdinal } from '@visx/scale'
import { Palette, PALETTE } from '../../reportContext'
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

  const { data: dataByBoundary, loading } = useDataByBoundary({
    report,
    boundaryType,
  })
  // Get min and max counts
  const minCount = Math.floor(
    Math.min(
      ...dataByBoundary.map((d) => d.count || 0).filter((count) => count > 0)
    )
  )
  const maxCount = Math.ceil(Math.max(...dataByBoundary.map((d) => d.count)))

  // Calculate difference and determine how many steps we need
  const difference = maxCount - minCount
  const numberOfSteps = Math.min(5, difference + 1)

  // Create domain array with appropriate number of steps
  const domain = Array.from({ length: numberOfSteps }, (_, i) =>
    Math.round(minCount + i * (difference / (numberOfSteps - 1 || 1)))
  )

  const interpolator =
    PALETTE[report.displayOptions.dataVisualisation.palette || Palette.Blue]
      .interpolator

  //Legend scale
  const ordinalScale = scaleOrdinal({
    domain,
    range: Array.from({ length: numberOfSteps }, (_, i) =>
      interpolator(i / (numberOfSteps - 1 || 1))
    ),
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
        <LegendOrdinal
          scale={ordinalScale}
          direction="row"
          itemDirection="column"
          labelMargin="6px 0 0 0"
          shapeMargin={0}
          shapeWidth={70}
          shapeHeight={10}
          className="text-meepGray-400 text-xs flex flex-col items-start"
        ></LegendOrdinal>
      </div>
    </div>
  )
}
