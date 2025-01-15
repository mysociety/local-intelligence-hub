'use client'

import { ReportConfig } from '../reportContext'
import { useReport } from './ReportProvider'
import ReportVisualisation from './ReportVisualisation'

export interface UpdateConfigProps {
  updateVisualisationConfig: (
    configItems: Partial<ReportConfig['dataVisualisation']>
  ) => void
}

const ReportConfiguration: React.FC = () => {
  const { report, updateReport } = useReport()

  const updateVisualisationConfig = (
    configItems: Partial<ReportConfig['dataVisualisation']>
  ) => {
    updateReport((draft) => {
      draft.displayOptions.dataVisualisation = {
        ...draft.displayOptions.dataVisualisation,
        ...configItems,
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <ReportVisualisation
        updateVisualisationConfig={updateVisualisationConfig}
      />
    </div>
  )
}

export default ReportConfiguration
