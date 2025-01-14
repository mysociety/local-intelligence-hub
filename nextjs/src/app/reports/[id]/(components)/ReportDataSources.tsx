import { AnalyticalAreaType } from '@/__generated__/graphql'
import {
  LucideBoxSelect,
  LucideMap,
  LucidePaintbrush,
  LucideType,
} from 'lucide-react'
import { useState } from 'react'
import { ReportConfig, VisualisationType } from '../reportContext'
import useDataSources from '../useDataSources'
import { AddMapLayerButton } from './AddDataSourceButton'
import DataSourcesList from './DataSourcesList'
import { EditorSelect } from './EditorSelect'
import { EditorSwitch } from './EditorSwitch'
import { useReport } from './ReportProvider'

export function ReportDataSources() {
  const { addDataSource } = useDataSources()
  const { updateReport, report } = useReport()

  const {
    displayOptions: {
      display: { showStreetDetails, showBoundaryNames } = {},
      dataVisualisation,
    },
    politicalBoundaries,
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
            updateReport({
              displayOptions: { display: { showBoundaryNames } },
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
            updateReport({
              displayOptions: { display: { showBorders } },
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
          options={politicalBoundaries.map((boundary) => ({
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
            updateReport({
              displayOptions: { display: { showStreetDetails } },
            })
          }}
        />
      </section>
    </div>
  )

  function updateVisualisationConfig(
    configItems: Partial<ReportConfig['dataVisualisation']>
  ) {
    updateReport({
      displayOptions: {
        dataVisualisation: {
          ...dataVisualisation,
          ...configItems,
        },
      },
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
}
