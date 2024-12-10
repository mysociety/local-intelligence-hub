import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronsUpDown } from 'lucide-react'
import React from 'react'
import { VisualisationType } from '../reportContext'
import { UpdateConfigProps } from './ReportConfiguration'
import { useReport } from './ReportProvider'

const ReportVisualisation: React.FC<UpdateConfigProps> = ({
  updateVisualisationConfig,
}) => {
  const { report } = useReport()
  const visualisationType =
    report?.displayOptions?.dataVisualisation?.visualisationType

  return (
    <Collapsible defaultOpen className="mb-2">
      <CollapsibleTrigger asChild>
        <div className="flex flex-row gap-2 items-center mt-3 mb-6 cursor-pointer">
          <ChevronsUpDown className="h-4 w-4 text-white" />
          <h3 className="text-white font-medium">Data Visualisation</h3>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="CollapsibleContent">
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
      </CollapsibleContent>
    </Collapsible>
  )
}

export default ReportVisualisation
