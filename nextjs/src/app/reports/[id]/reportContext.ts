import {
  AnalyticalAreaType,
  MapLayer,
  MapLayerInput,
  MapReport,
} from '@/__generated__/graphql'
import { createContext } from 'react'
import { OptimisticMutationUpdateMapLayers } from './(components)/ReportProvider'
import { PoliticalTileset } from './politicalTilesets'

export enum VisualisationType {
  Choropleth = 'choropleth',
}

export const VisualisationLabels: Record<VisualisationType, string> = {
  [VisualisationType.Choropleth]: 'Colour shading by category',
}

export enum Palette {
  Blue = 'blue',
}

export type MapReportExtended = Omit<MapReport, 'displayOptions'> & {
  displayOptions: ReportConfig
  politicalBoundaries: PoliticalTileset[]
}

export interface ReportConfig {
  dataVisualisation: {
    boundaryType?: AnalyticalAreaType
    visualisationType?: VisualisationType
    palette?: Palette
    dataSource?: MapLayer['id']
    dataSourceField?: string
    showDataVisualisation?: Record<VisualisationType, boolean>
  }
  display: {
    showStreetDetails?: boolean
    showMPs?: boolean
    showLastElectionData?: boolean
    showPostcodeLabels?: boolean
    boundaryOutlines?: AnalyticalAreaType[]
    showBoundaryNames?: boolean
  }
}

export const defaultReportConfig: ReportConfig = {
  dataVisualisation: {
    boundaryType: AnalyticalAreaType.ParliamentaryConstituency_2024,
    visualisationType: VisualisationType.Choropleth,
    palette: Palette.Blue,
    showDataVisualisation: {
      [VisualisationType.Choropleth]: true, // Default to Choropleth
    },
  },
  display: {
    showStreetDetails: false,
    showPostcodeLabels: false,
    showMPs: false,
    showLastElectionData: false,
    boundaryOutlines: [AnalyticalAreaType.ParliamentaryConstituency_2024],
    showBoundaryNames: true,
  },
}
interface ReportContextProps {
  report: MapReportExtended
  deleteReport: () => void
  updateReport: (payload: {
    name?: string
    displayOptions?: Partial<ReportConfig>
    layers?: any[]
  }) => void
  updateLayer: (
    layerId: string,
    layer: Partial<MapLayerInput>,
    optimisticUpdate?: OptimisticMutationUpdateMapLayers
  ) => void
  refreshReportData: () => void
  dataLoading: boolean
  setDataLoading: (loading: boolean) => void
}

const ReportContext = createContext<ReportContextProps>({
  report: {} as MapReportExtended,
  deleteReport: () => {},
  updateReport: () => {},
  updateLayer: () => {},
  refreshReportData: () => {},
  dataLoading: false,
  setDataLoading: () => {},
})

export default ReportContext
