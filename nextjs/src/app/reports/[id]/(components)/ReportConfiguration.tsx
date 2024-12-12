'use client'

import { Separator } from '@/components/ui/separator'
import { ReportConfig } from '../reportContext'
import useDataByBoundary from '../useDataByBoundary'
import ReportBoundaries from './ReportBoundaries'
import { useReport } from './ReportProvider'
import ReportVisualisation from './ReportVisualisation'

export interface UpdateConfigProps {
  updateVisualisationConfig: (
    configItems: Partial<ReportConfig['dataVisualisation']>
  ) => void
}

const ReportConfiguration: React.FC = () => {
  const { report, updateReport } = useReport()

  const dataVisualisation = report.displayOptions.dataVisualisation

  const { loading } = useDataByBoundary({
    report,
    boundaryType: dataVisualisation?.boundaryType,
  })

  const updateVisualisationConfig = (
    configItems: Partial<ReportConfig['dataVisualisation']>
  ) => {
    updateReport({
      displayOptions: {
        dataVisualisation: {
          ...dataVisualisation,
          ...configItems,
        },
      },
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <ReportBoundaries updateVisualisationConfig={updateVisualisationConfig} />
      <Separator
        className="bg-meepGray-800 ml-[-16px]"
        style={{ width: 'calc(100% + 32px)' }}
      />
      {loading && <p>LOADING....</p>}
      <ReportVisualisation
        updateVisualisationConfig={updateVisualisationConfig}
      />
    </div>
  )
}

export default ReportConfiguration
