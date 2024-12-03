import { MapReport } from '@/__generated__/graphql'
import { createContext } from 'react'

type UKPoliticalBoundaries =
  | 'uk_westminster_wards'
  | 'uk_westminster_constituencies'
  | 'localAuthorities'
  | 'countries'
/* // US political boundaries are only here as an example for future expansion
type USPoliticalBoundaries = 'states' | 'counties' | 'congressionalDistricts'
type PoliticalBoundaries = UKPoliticalBoundaries | USPoliticalBoundaries */
export type PoliticalBoundaries = UKPoliticalBoundaries
type VisualisationType = 'choropleth'
type Palette = 'blue'

export type MapReportExtended = MapReport & { displayOptions: ReportConfig }

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
    boundaryType: 'uk_westminster_constituencies',
    visualisationType: 'choropleth',
    palette: 'blue',
  },
  display: {
    streetDetails: false,
    postcodeLabels: false,
    boundaryOutlines: ['uk_westminster_constituencies'],
  },
}

interface ReportContextProps {
  report: MapReportExtended
  deleteReport: () => void
  updateReport: (payload: {
    name?: string
    displayOptions?: ReportConfig
    layers?: any[]
  }) => void
  refreshReportData: () => void
}

const ReportContext = createContext<ReportContextProps>({
  report: {} as MapReportExtended,
  deleteReport: () => {},
  updateReport: () => {},
  refreshReportData: () => {},
})

export default ReportContext
