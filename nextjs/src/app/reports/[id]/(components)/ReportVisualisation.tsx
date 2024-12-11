import { MapLayer } from '@/__generated__/graphql'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import React from 'react'
import { VisualisationType } from '../reportContext'
import CollapsibleSection from './CollapsibleSection'
import { UpdateConfigProps } from './ReportConfiguration'
import { useReport } from './ReportProvider'

const ReportVisualisation: React.FC<UpdateConfigProps> = ({
  updateVisualisationConfig,
}) => {
  const {
    report: {
      layers,
      politicalBoundaries,
      displayOptions: { dataVisualisation },
    },
  } = useReport()
  const visualisationType = dataVisualisation?.visualisationType
  const dataSource = dataVisualisation?.dataSource
  const selectedBoundaryLabel = politicalBoundaries.find(
    (boundary) => boundary.boundaryType === dataVisualisation?.boundaryType
  )?.label

  return (
    <CollapsibleSection id="report-visualisation" title="Data Visualisation">
      <div className="flex flex-col gap-3">
        <div>
          <Select
            onValueChange={(type) =>
              updateVisualisationConfig({
                visualisationType: type as VisualisationType,
              })
            }
            value={visualisationType}
          >
            <Label
              htmlFor="select-vis-type"
              className="text-white text-sm font-medium"
            >
              Type
            </Label>
            <SelectTrigger
              id="select-vis-type"
              className="w-full border-meepGray-100 text-meepGray-100 mt-2 font-medium"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(VisualisationType).map((type) => (
                <SelectItem className="font-medium" key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-meepGray-400 text-sm font-normal mb-3 mt-3">
            Colour shading by category
          </p>
        </div>
        <div>
          <Select
            onValueChange={(type) =>
              updateVisualisationConfig({
                dataSource: type as MapLayer['id'],
              })
            }
            value={dataSource}
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
                  {layer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-meepGray-400 text-sm font-normal mb-3 mt-3">
            Select which data will populate your {selectedBoundaryLabel}
          </p>
        </div>
      </div>
    </CollapsibleSection>
  )
}

export default ReportVisualisation
