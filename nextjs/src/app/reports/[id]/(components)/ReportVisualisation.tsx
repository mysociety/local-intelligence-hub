import { startCase } from 'lodash'
import pluralize from 'pluralize'
import React, { useState } from 'react'
import { PALETTE, VisualisationType } from '../reportContext'
import useDataByBoundary from '../useDataByBoundary'
import { EditorSelect } from './EditorSelect'
import { UpdateConfigProps } from './ReportConfiguration'
import { useReport } from './ReportProvider'

const ReportVisualisation: React.FC<UpdateConfigProps> = ({
  updateVisualisationConfig,
}) => {
  const { report, updateReport } = useReport()
  const {
    layers,
    politicalBoundaries,
    displayOptions: { dataVisualisation },
  } = report

  const { fieldNames } = useDataByBoundary({
    report,
    boundaryType: dataVisualisation?.boundaryType,
  })

  const [checkedTypes, setCheckedTypes] = useState<Record<string, boolean>>(
    () =>
      Object.values(VisualisationType).reduce(
        (acc, type) => ({
          ...acc,
          [type]: type === dataVisualisation?.visualisationType,
        }),
        {}
      )
  )

  const handleSwitchChange = (type: VisualisationType, checked: boolean) => {
    setCheckedTypes((prev) => ({
      ...prev,
      [type]: checked,
    }))

    updateReport({
      displayOptions: {
        ...report.displayOptions,
        dataVisualisation: {
          ...report.displayOptions.dataVisualisation,
          showDataVisualisation: {
            ...Object.values(VisualisationType).reduce(
              (acc, visType) => {
                acc[visType] =
                  report.displayOptions.dataVisualisation
                    ?.showDataVisualisation?.[visType] ?? false
                return acc
              },
              {} as Record<VisualisationType, boolean>
            ),
            [type]: checked,
          },
          visualisationType: checked ? type : undefined,
        },
      },
    })
  }
  const dataSourceId = dataVisualisation?.dataSource
  const dataSourceField = dataVisualisation?.dataSourceField
  const selectedDataSource = layers.find((layer) => layer.id === dataSourceId)
  const selectedBoundaryLabel = politicalBoundaries.find(
    (boundary) => boundary.boundaryType === dataVisualisation?.boundaryType
  )?.label
  const isLoading = !fieldNames || fieldNames.length === 0

  return (
    <div className="flex flex-col gap-3 py-4">
      <h2 className="font-semibold text-white text-sm">Choropleth</h2>
      <p className="text-meepGray-300 text-sm mb-3 font-normal">
        Shade the map based on your data in each{' '}
        {pluralize(selectedBoundaryLabel || 'area', 1)}
      </p>
      {checkedTypes['choropleth'] && (
        <>
          {report.layers.length && (
            <EditorSelect
              label="Data source"
              // explainer={`Select which data will populate your ${selectedBoundaryLabel}`}
              value={dataSourceId}
              options={layers.map((layer) => ({
                label: startCase(layer.name),
                value: layer.id,
              }))}
              onChange={(dataSource) =>
                updateVisualisationConfig({ dataSource })
              }
            />
          )}

          <EditorSelect
            label="Colour by"
            // explainer={`Which field from your data source will be visualised?`}
            value={dataSourceField}
            options={fieldNames || []}
            onChange={(dataSourceField) =>
              updateVisualisationConfig({ dataSourceField })
            }
            disabled={
              isLoading || selectedDataSource?.source.dataType !== 'AREA_STATS'
            }
            disabledMessage={
              selectedDataSource?.source.dataType !== 'AREA_STATS'
                ? `Count of records per area`
                : undefined
            }
          />

          <EditorSelect
            label="Fill"
            // explainer={`Select the boundary type to visualise your data`}
            value={dataVisualisation?.palette}
            options={Object.entries(PALETTE).map(([value, res]) => ({
              label: res.label,
              value,
              // TODO: display the palette
            }))}
            onChange={(palette) => {
              updateVisualisationConfig({
                palette: palette as keyof typeof PALETTE,
              })
            }}
          />
        </>
      )}
    </div>
  )
}

export default ReportVisualisation
