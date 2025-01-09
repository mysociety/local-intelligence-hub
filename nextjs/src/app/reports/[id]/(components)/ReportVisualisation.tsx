import { CRMSelection } from '@/components/CRMButtonItem'
import { Textarea } from '@/components/ui/textarea'
import pluralize from 'pluralize'
import React, { useState } from 'react'
import { PALETTE, VisualisationType } from '../reportContext'
import { useSourceMetadata } from '../useSourceMetadata'
import { EditorSelect } from './EditorSelect'
import { EditorSwitch } from './EditorSwitch'
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
  const selectedDataSource = layers.find(
    (layer) => layer.source.id === dataSourceId
  )
  const selectedBoundaryLabel = politicalBoundaries.find(
    (boundary) => boundary.boundaryType === dataVisualisation?.boundaryType
  )?.label

  const sourceMetadata = useSourceMetadata(dataSourceId)

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
                label: (
                  <CRMSelection
                    source={layer.source}
                    displayCount={false}
                    className="max-w-36 truncate"
                  />
                ),
                value: layer.source.id,
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
            options={
              sourceMetadata.data?.externalDataSource.fieldDefinitions?.map(
                (d) => ({
                  label: d.label,
                  value: d.value,
                })
              ) || []
            }
            onChange={(dataSourceField) =>
              updateVisualisationConfig({ dataSourceField })
            }
            disabled={
              sourceMetadata.loading ||
              selectedDataSource?.source.dataType !== 'AREA_STATS'
            }
            disabledMessage={
              selectedDataSource?.source.dataType !== 'AREA_STATS'
                ? `Count of records per area`
                : undefined
            }
          />

          <h2 className="text-meepGray-400 text-sm mb-0">
            Write a custom colour-by formula
          </h2>
          <Textarea
            value={dataSourceField}
            onChange={(e) => {
              updateVisualisationConfig({ dataSourceField: e.target.value })
            }}
            className="bg-meepGray-950 rounded text-white"
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

          <EditorSwitch
            label="Invert fill"
            explainer={`Reverse the colour scale`}
            value={dataVisualisation?.paletteReversed || false}
            onChange={(paletteReversed) => {
              updateVisualisationConfig({ paletteReversed })
            }}
          />
        </>
      )}
    </div>
  )
}

export default ReportVisualisation
