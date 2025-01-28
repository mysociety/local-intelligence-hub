import { ChoroplethMode } from '@/__generated__/graphql'
import { CRMSelection } from '@/components/CRMButtonItem'
import { Textarea } from '@/components/ui/textarea'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import { lowerCase } from 'lodash'
import pluralize from 'pluralize'
import React from 'react'
import toSpaceCase from 'to-space-case'
import { POLITICAL_BOUNDARIES } from '../politicalTilesets'
import { PALETTE, ViewType } from '../reportContext'
import { EditorSelect } from './EditorSelect'
import { EditorSwitch } from './EditorSwitch'

const ReportVisualisation: React.FC = () => {
  const report = useReport()
  const view = useView(ViewType.Map)
  const choroplethLayer = report.report.layers.find(
    (layer) =>
      layer.id === view.currentViewOfType?.mapOptions?.choropleth.layerId
  )
  const selectedBoundaryLabel = POLITICAL_BOUNDARIES.find(
    (boundary) =>
      boundary.boundaryType ===
      view.currentViewOfType?.mapOptions.choropleth.boundaryType
  )?.label

  return (
    <div className="flex flex-col gap-3 py-4">
      <h2 className="font-semibold text-white text-sm">Choropleth</h2>
      <p className="text-meepGray-300 text-sm mb-3 font-normal">
        Shade the map based on your data in each{' '}
        {pluralize(selectedBoundaryLabel || 'area', 1)}
      </p>
      <>
        {report.report.layers.length && (
          <EditorSelect
            label="Layer"
            value={view.currentViewOfType?.mapOptions?.choropleth.layerId}
            options={report.report.layers.map((layer) => ({
              value: layer.id,
              label: (
                <CRMSelection
                  source={layer.sourceData}
                  displayCount={false}
                  className="max-w-36 truncate"
                />
              ),
            }))}
            onChange={(dataSource) =>
              view.updateView((draft) => {
                draft.mapOptions.choropleth.layerId = dataSource
              })
            }
          />
        )}

        <EditorSelect
          label="Choropleth mode"
          // explainer={`Select the boundary type to visualise your data`}
          value={view.currentViewOfType?.mapOptions?.choropleth.mode}
          options={Object.entries(ChoroplethMode).map(([key, value]) => ({
            value,
            label: toSpaceCase(key),
          }))}
          onChange={(palette) =>
            view.updateView((draft) => {
              draft.mapOptions.choropleth.mode = palette as ChoroplethMode
            })
          }
        />

        {view.currentViewOfType?.mapOptions.choropleth.mode ===
          ChoroplethMode.Field && (
          <EditorSelect
            label="Colour by"
            // explainer={`Which field from your data source will be visualised?`}
            value={view.currentViewOfType?.mapOptions?.choropleth.field}
            options={[
              ...(choroplethLayer?.sourceData.fieldDefinitions
                ?.filter(
                  // no ID fields
                  (d) => d.value !== choroplethLayer.sourceData.idField
                )
                .map((d) => ({
                  label: d.label,
                  value: d.value,
                })) || []),
            ]}
            onChange={(dataSourceField) =>
              view.updateView((draft) => {
                draft.mapOptions.choropleth.field = dataSourceField
              })
            }
            disabled={!choroplethLayer}
            disabledMessage={
              choroplethLayer?.sourceData.dataType !== 'AREA_STATS'
                ? `Count of ${lowerCase(pluralize(choroplethLayer?.sourceData.dataType || 'record', 2))}`
                : undefined
            }
          />
        )}

        {view.currentViewOfType?.mapOptions.choropleth.mode ===
          ChoroplethMode.Formula && (
          <>
            <h2 className="text-meepGray-400 text-sm mb-0">
              Write a custom colour-by formula
            </h2>
            <Textarea
              value={view.currentViewOfType?.mapOptions?.choropleth.formula}
              onChange={(e) =>
                view.updateView((draft) => {
                  draft.mapOptions.choropleth.formula = e.target.value
                })
              }
              className="bg-meepGray-950 rounded text-white"
            />
          </>
        )}

        <EditorSelect
          label="Fill"
          // explainer={`Select the boundary type to visualise your data`}
          value={view.currentViewOfType?.mapOptions?.choropleth.palette}
          options={Object.entries(PALETTE).map(([value, res]) => ({
            label: toSpaceCase(res.label),
            value,
            // TODO: display the palette
          }))}
          onChange={(palette) =>
            view.updateView((draft) => {
              draft.mapOptions.choropleth.palette =
                palette as keyof typeof PALETTE
            })
          }
        />

        <EditorSwitch
          label="Invert fill"
          explainer={`Reverse the colour scale`}
          value={
            view.currentViewOfType?.mapOptions?.choropleth.isPaletteReversed
          }
          onChange={(paletteReversed) =>
            view.updateView((draft) => {
              draft.mapOptions.choropleth.isPaletteReversed = paletteReversed
            })
          }
        />
      </>
    </div>
  )
}

export default ReportVisualisation
