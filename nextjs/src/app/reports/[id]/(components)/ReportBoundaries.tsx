import { AnalyticalAreaType } from '@/__generated__/graphql'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronsUpDown } from 'lucide-react'
import React from 'react'
import { getPoliticalTilesetsByCountry } from '../politicalTilesets'
import { UpdateConfigProps } from './ReportConfiguration'
import { useReport } from './ReportProvider'

const ReportBoundaries: React.FC<UpdateConfigProps> = ({
  updateVisualisationConfig,
}) => {
  const { report } = useReport()

  // TODO: Make the country part of the report configuration
  const politicalBoundaries = getPoliticalTilesetsByCountry('uk')

  const {
    displayOptions: { dataVisualisation },
  } = report

  const updateBoundaryType = (boundaryType: AnalyticalAreaType) => {
    updateVisualisationConfig({
      boundaryType,
    })
  }

  return (
    <Collapsible defaultOpen className="mb-2">
      <CollapsibleTrigger asChild>
        <div className="flex flex-row gap-2 items-center my-3 cursor-pointer">
          <ChevronsUpDown className="h-4 w-4 text-white" />
          <h3 className="text-white font-medium">Political Boundaries</h3>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="CollapsibleContent">
        <Select
          onValueChange={updateBoundaryType}
          value={dataVisualisation?.boundaryType}
        >
          <SelectTrigger className="w-full border-meepGray-100 text-meepGray-100 font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {politicalBoundaries.map((boundary) => (
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
      </CollapsibleContent>
    </Collapsible>
  )
}

export default ReportBoundaries
