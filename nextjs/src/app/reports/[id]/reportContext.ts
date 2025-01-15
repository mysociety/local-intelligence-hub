import {
  AnalyticalAreaType,
  DataSourceType,
  MapLayer,
  MapLayerInput,
  MapReport,
  MapReportInput,
} from '@/__generated__/graphql'
import {
  interpolateBlues,
  interpolateBrBG,
  interpolateGreens,
  interpolateInferno,
  interpolateOranges,
  interpolatePurples,
  interpolateRdYlBu,
  interpolateRdYlGn,
  interpolateReds,
} from 'd3-scale-chromatic'
import { WritableDraft } from 'immer'
import { createContext } from 'react'
import { OptimisticMutationUpdateMapLayers } from './(components)/ReportProvider'

export enum VisualisationType {
  Choropleth = 'choropleth',
}

export const VisualisationLabels: Record<VisualisationType, string> = {
  [VisualisationType.Choropleth]: 'Colour shading by category',
}

export enum Palette {
  Blue = 'blue',
  Red = 'Red',
  Purple = 'Purple',
  Orange = 'Orange',
  Green = 'Green',
  Inferno = 'Inferno',
  DivergentRedGreen = 'DivergentRedGreen',
  DivergentBlueRed = 'DivergentBlueRed',
  DivergentBrBg = 'DivergentBrBg',
}

export const PALETTE: Record<
  Palette,
  {
    label: string
    interpolator: (t: number) => string
  }
> = {
  [Palette.Blue]: {
    label: 'Blue',
    // Reversed so that black is the lowest value
    interpolator: (t) => interpolateBlues(1 - t),
  },
  [Palette.Red]: {
    label: 'Red',
    interpolator: (t) => interpolateReds(1 - t),
  },
  [Palette.Purple]: {
    label: 'Purple',
    interpolator: (t) => interpolatePurples(1 - t),
  },
  [Palette.Orange]: {
    label: 'Orange',
    interpolator: (t) => interpolateOranges(1 - t),
  },
  [Palette.Green]: {
    label: 'Green',
    interpolator: (t) => interpolateGreens(1 - t),
  },
  [Palette.Inferno]: {
    label: 'Inferno',
    interpolator: interpolateInferno,
  },
  [Palette.DivergentRedGreen]: {
    label: 'Red/Green',
    interpolator: interpolateRdYlGn,
  },
  [Palette.DivergentBlueRed]: {
    label: 'Blue/Red',
    interpolator: interpolateRdYlBu,
  },
  [Palette.DivergentBrBg]: {
    label: 'Brown/Beige',
    interpolator: interpolateBrBG,
  },
}

export function getReportPalette(displayOptions: ReportConfig) {
  const interpolator =
    PALETTE[displayOptions.dataVisualisation.palette || Palette.Blue]
      .interpolator
  if (displayOptions.dataVisualisation.paletteReversed) {
    return (t: number) => interpolator(1 - t)
  }
  return interpolator
}

export type MapReportExtended = Omit<MapReport, 'displayOptions'> & {
  displayOptions: ReportConfig
}

export interface ReportConfig {
  dataVisualisation: {
    boundaryType?: AnalyticalAreaType
    visualisationType?: VisualisationType
    palette?: Palette
    paletteReversed?: boolean
    dataSource?: MapLayer['id']
    dataSourceField?: string
    showDataVisualisation?: Record<VisualisationType, boolean>
  }
  display: {
    showBorders?: boolean
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
    paletteReversed: false,
    showDataVisualisation: {
      [VisualisationType.Choropleth]: true, // Default to Choropleth
    },
  },
  display: {
    showBorders: true,
    showStreetDetails: false,
    showPostcodeLabels: false,
    showMPs: false,
    showLastElectionData: false,
    boundaryOutlines: [AnalyticalAreaType.ParliamentaryConstituency_2024],
    showBoundaryNames: true,
  },
}

export type AddSourcePayload = {
  name: string
  id: string
  dataType: DataSourceType
}

export interface ReportContextProps {
  report: MapReportExtended
  deleteReport: () => void
  updateReport: (
    editedOutput: (draft: WritableDraft<MapReportInput>) => void,
    optimisticMutation?: OptimisticMutationUpdateMapLayers
  ) => void
  updateLayer: (
    layerId: string,
    layer: Partial<MapLayerInput>,
    optimisticUpdate?: OptimisticMutationUpdateMapLayers
  ) => void
  refreshReportData: () => void
  dataLoading: boolean
  setDataLoading: (loading: boolean) => void
  removeDataSource: (layerId: string) => void
  addDataSource: (layer: AddSourcePayload) => void
}

const ReportContext = createContext<ReportContextProps>({
  report: {} as MapReportExtended,
  deleteReport: () => {},
  updateReport: () => {},
  updateLayer: () => {},
  refreshReportData: () => {},
  dataLoading: false,
  setDataLoading: () => {},
  removeDataSource: () => {},
  addDataSource: () => {},
})

export default ReportContext
