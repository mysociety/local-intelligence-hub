import { MapReport } from '@/__generated__/graphql'
import { createContext } from 'react'

type UKPoliticalBoundaries =
  | 'wards'
  | 'constituencies'
  | 'localAuthorities'
  | 'countries'
/* // US political boundaries are only here as an example for future expansion
type USPoliticalBoundaries = 'states' | 'counties' | 'congressionalDistricts'
type PoliticalBoundaries = UKPoliticalBoundaries | USPoliticalBoundaries */
export type PoliticalBoundaries = UKPoliticalBoundaries
type VisualisationType = 'choropleth'
type Palette = 'blue'

export interface ReportConfig {
  name: string
  dataSources: any[]
  dataVisualisation: {
    boundaryType: PoliticalBoundaries
    visualisationType: VisualisationType
    palette: Palette
  }
  display: {
    streetDetails: boolean
    postcodeLabels: boolean
    boundaryOutlines: PoliticalBoundaries[]
  }
}

export const defaultReportConfig: ReportConfig = {
  name: 'My New Report',
  dataSources: [],
  dataVisualisation: {
    boundaryType: 'constituencies',
    visualisationType: 'choropleth',
    palette: 'blue',
  },
  display: {
    streetDetails: false,
    postcodeLabels: false,
    boundaryOutlines: ['constituencies'],
  },
}

interface ReportContextProps {
  report?: MapReport
  reportConfig: ReportConfig
  deleteReport: () => void
  updateReportConfig: (reportConfig: ReportConfig) => void
  refreshReportData: () => void
}

const ReportContext = createContext<ReportContextProps>({
  reportConfig: defaultReportConfig,
  deleteReport: () => {},
  updateReportConfig: () => {},
  refreshReportData: () => {},
})

export default ReportContext
