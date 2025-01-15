import { AnalyticalAreaType } from '@/__generated__/graphql'
import {
  LucideBoxSelect,
  LucideMap,
  LucidePaintbrush,
  LucideType,
} from 'lucide-react'
import { useState } from 'react'
import { POLITICAL_BOUNDARIES } from '../politicalTilesets'
import { ReportConfig, VisualisationType } from '../reportContext'
import { AddMapLayerButton } from './AddDataSourceButton'
import DataSourcesList from './DataSourcesList'
import { EditorSelect } from './EditorSelect'
import { EditorSwitch } from './EditorSwitch'
import { useReport } from './ReportProvider'

export function ReportDataSources() {
  const { updateReport, report, addDataSource } = useReport()

  const {
    displayOptions: {
      display: { showStreetDetails, showBoundaryNames } = {},
      dataVisualisation,
    },
  } = report

  const [checkedTypes, setCheckedTypes] = useState<
    Record<VisualisationType, boolean>
  >(
    dataVisualisation?.showDataVisualisation ||
      ({} as Record<VisualisationType, boolean>)
  )

  return (
    <div className="space-y-8 py-4">
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-sm">Data sources</h2>
        <DataSourcesList />
        <div className="flex gap-2 items-center mt-1">
          <AddMapLayerButton addLayer={addDataSource} />
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-sm">Base layers</h2>

        {Object.values(VisualisationType).map((type) => (
          <EditorSwitch
            key={type}
            label={
              <span className="flex flex-row items-center gap-1 w-full">
                <LucidePaintbrush className="w-5 h-5 text-meepGray-400" />
                <span className="text-white">Data visualisation</span>
              </span>
            }
            labelClassName="text-white"
            value={checkedTypes[type]}
            onChange={(checked) => handleSwitchChange(type, checked)}
          />
        ))}

        <EditorSwitch
          label={
            <span className="flex flex-row items-center gap-1 w-full">
              <LucideType className="w-5 h-5 text-meepGray-400" />
              <span className="text-white">Place labels</span>
            </span>
          }
          labelClassName="text-white"
          value={showBoundaryNames}
          onChange={(showBoundaryNames: boolean) => {
            updateReport((draft) => {
              draft.displayOptions.display.showBoundaryNames = showBoundaryNames
            })
          }}
        />

        <EditorSwitch
          label={
            <span className="flex flex-row items-center gap-1 w-full">
              <LucideBoxSelect className="w-5 h-5 text-meepGray-400" />
              <span className="text-white">Borders</span>
            </span>
          }
          labelClassName="text-white"
          value={report.displayOptions.display.showBorders}
          onChange={(showBorders: boolean) => {
            updateReport((draft) => {
              draft.displayOptions.display.showBorders = showBorders
            })
          }}
        />

        <EditorSelect
          className="-my-2"
          label={
            <span className="flex flex-row items-center gap-1 w-full">
              <LucideBoxSelect className="w-5 h-5 text-meepGray-400" />
              <span className="text-white">Border type</span>
            </span>
          }
          onChange={(d) => updateBoundaryType(d as AnalyticalAreaType)}
          value={dataVisualisation?.boundaryType}
          options={POLITICAL_BOUNDARIES.map((boundary) => ({
            label: boundary.label,
            value: boundary.boundaryType,
          }))}
        />

        <EditorSwitch
          label={
            <span className="flex flex-row items-center gap-1 w-full">
              <LucideMap className="w-5 h-5 text-meepGray-400" />
              <span className="text-white">Street details</span>
            </span>
          }
          labelClassName="text-white"
          value={showStreetDetails}
          onChange={(showStreetDetails: boolean) => {
            updateReport((draft) => {
              draft.displayOptions.display.showStreetDetails = showStreetDetails
            })
          }}
        />
      </section>
    </div>
  )

  function updateVisualisationConfig(
    configItems: Partial<ReportConfig['dataVisualisation']>
  ) {
    updateReport((draft) => {
      draft.displayOptions.dataVisualisation = {
        ...draft.displayOptions.dataVisualisation,
        ...configItems,
      }
    })
  }

  function updateBoundaryType(boundaryType: AnalyticalAreaType) {
    updateVisualisationConfig({
      boundaryType,
    })
  }

  function handleSwitchChange(type: VisualisationType, checked: boolean) {
    setCheckedTypes((prev) => ({
      ...prev,
      [type]: checked,
    }))

    updateReport((draft) => {
      draft.displayOptions.dataVisualisation.showDataVisualisation = draft
        .displayOptions.dataVisualisation.showDataVisualisation || {
        [VisualisationType.Choropleth]: false,
      }
      draft.displayOptions.dataVisualisation.showDataVisualisation[type] =
        checked
      draft.displayOptions.dataVisualisation.visualisationType = checked
        ? type
        : undefined
    })
  }
}
