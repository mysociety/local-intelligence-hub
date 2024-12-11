import { AnalyticalAreaType } from '@/__generated__/graphql'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import React from 'react'
import CollapsibleSection from './CollapsibleSection'
import { UpdateConfigProps } from './ReportConfiguration'
import { useReport } from './ReportProvider'

const ReportBoundaries: React.FC<UpdateConfigProps> = ({
  updateVisualisationConfig,
}) => {
  const { report } = useReport()

  const {
    displayOptions: { dataVisualisation },
  } = report

  const updateBoundaryType = (boundaryType: AnalyticalAreaType) => {
    updateVisualisationConfig({
      boundaryType,
    })
  }

  return (
    <CollapsibleSection id="report-boundaries" title="Boundaries">
      <Select
        onValueChange={updateBoundaryType}
        value={dataVisualisation?.boundaryType}
      >
        <SelectTrigger className="w-full border-meepGray-100 text-meepGray-100 font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {report.politicalBoundaries.map((boundary) => (
            <SelectItem
              className="font-medium"
              key={boundary.boundaryType}
              value={boundary.boundaryType}
            >
              {boundary.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-meepGray-400 text-sm font-normal mb-3 mt-3">
        Includes Westminster constituencies and wards.
      </p>
    </CollapsibleSection>
  )
}

export default ReportBoundaries
