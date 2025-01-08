import { MapLayer } from '@/__generated__/graphql'
import { Label } from '@/components/ui/label'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { startCase } from 'lodash'
import React, { useState } from 'react'
import {
  AggregationOperation,
  VisualisationLabels,
  VisualisationType,
} from '../reportContext'
import useDataByBoundary from '../useDataByBoundary'
import CollapsibleSection from './CollapsibleSection'
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
    <CollapsibleSection id="report-visualisation" title="Data Visualisation">
      <div className="flex flex-col gap-3">
        <div className="text-white text-sm font-medium">Type</div>
        <div className="flex flex-col gap-2">
          {Object.values(VisualisationType).map((type) => (
            <div key={type} className="flex items-center space-x-2 mt-2">
              <Switch
                id={`switch-${type}`}
                checked={checkedTypes[type]}
                onCheckedChange={(checked) => handleSwitchChange(type, checked)}
              />
              <Label
                className="text-white text-sm font-medium"
                htmlFor={`switch-${type}`}
              >
                {startCase(type)}
              </Label>
              {VisualisationLabels[type] && (
                <span className="text-meepGray-400 text-xs ml-2">
                  {VisualisationLabels[type]}
                </span>
              )}
            </div>
          ))}
        </div>
        {checkedTypes['choropleth'] && (
          <>
            {report.layers.length && (
              <div>
                <Select
                  onValueChange={(type) =>
                    updateVisualisationConfig({
                      dataSource: type as MapLayer['id'],
                    })
                  }
                  value={dataSourceId}
                >
                  <Label
                    htmlFor="select-vis-type"
                    className="text-white text-sm font-medium"
                  >
                    Colour by
                  </Label>
                  <SelectTrigger
                    id="select-vis-type"
                    className="w-full border-meepGray-100 text-meepGray-100 mt-2 font-medium"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {layers.map((layer) => (
                      <SelectItem
                        className="font-medium"
                        key={layer.id}
                        value={layer.id}
                      >
                        {startCase(layer.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-meepGray-400 text-sm font-normal mb-3 mt-3">
                  Select which data will populate your {selectedBoundaryLabel}
                </p>
              </div>
            )}

            {selectedDataSource?.source.dataType === 'AREA_STATS' && (
              <div>
                <Select
                  onValueChange={(type) =>
                    updateVisualisationConfig({
                      dataSourceField: type as MapLayer['id'],
                    })
                  }
                  value={dataSourceField}
                  defaultOpen={!dataSourceField}
                  required
                  disabled={isLoading}
                >
                  <Label
                    htmlFor="select-vis-type"
                    className="text-white text-sm font-medium"
                  >
                    Select data field
                  </Label>
                  <SelectTrigger
                    id="select-vis-type"
                    className="w-full border-meepGray-100 text-meepGray-100 mt-2 font-medium flex items-center"
                  >
                    {isLoading ? <LoadingIcon size={'18'} /> : <SelectValue />}
                  </SelectTrigger>
                  {!isLoading && (
                    <SelectContent>
                      {fieldNames.map((field) => (
                        <SelectItem
                          className="font-medium"
                          key={field}
                          value={field}
                        >
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  )}
                </Select>
                <p className="text-meepGray-400 text-sm font-normal mb-3 mt-3">
                  Select the field from your data source
                </p>
              </div>
            )}
          </>
        )}

        {/* aggregation option */}
        {selectedDataSource?.source.dataType === 'AREA_STATS' && (
          <div>
            <Select
              onValueChange={(value) =>
                updateVisualisationConfig({
                  aggregationOperation: value as AggregationOperation,
                })
              }
              value={
                dataVisualisation.aggregationOperation ||
                AggregationOperation.Sum
              }
            >
              <Label
                htmlFor="select-vis-type"
                className="text-white text-sm font-medium"
              >
                Aggregation operation
              </Label>
              <SelectTrigger
                id="select-vis-type"
                className="w-full border-meepGray-100 text-meepGray-100 mt-2 font-medium"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(AggregationOperation).map((operation) => (
                  <SelectItem
                    className="font-medium"
                    key={operation}
                    value={operation}
                  >
                    {startCase(operation)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-meepGray-400 text-sm font-normal mb-3 mt-3">
              Choose how to handle numeric data when aggregating.
            </p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}

export default ReportVisualisation
