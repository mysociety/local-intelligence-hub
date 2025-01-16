import {
  AnalyticalAreaType,
  DataSourceType,
  MapLayerInput,
  MapReport,
} from '@/__generated__/graphql'
import { StarredState, starredStateResolver } from '@/lib/map'
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
import * as z from 'zod'

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

export const reportConfigTypeChecker = z.object({
  dataVisualisation: z.object({
    boundaryType: z.nativeEnum(AnalyticalAreaType).optional(),
    visualisationType: z.nativeEnum(VisualisationType).optional(),
    palette: z.nativeEnum(Palette).optional(),
    paletteReversed: z.boolean().optional(),
    dataSource: z.string().optional(),
    dataSourceField: z.string().optional(),
    showDataVisualisation: z
      .record(z.boolean())
      .optional()
      .describe('Deprecated'),
  }),
  display: z.object({
    showDataVisualisation: z.boolean().optional(),
    showBorders: z.boolean().optional(),
    showStreetDetails: z.boolean().optional(),
    showMPs: z.boolean().optional(),
    showLastElectionData: z.boolean().optional(),
    showPostcodeLabels: z.boolean().optional(),
    boundaryOutlines: z.array(z.nativeEnum(AnalyticalAreaType)).optional(),
    showBoundaryNames: z.boolean().optional(),
  }),
  starred: z.array(starredStateResolver),
})

export type ReportConfig = z.infer<typeof reportConfigTypeChecker>

export const defaultReportConfig: ReportConfig = {
  dataVisualisation: {
    boundaryType: AnalyticalAreaType.ParliamentaryConstituency_2024,
    visualisationType: VisualisationType.Choropleth,
    palette: Palette.Blue,
    paletteReversed: false,
  },
  display: {
    showDataVisualisation: true,
    showBorders: true,
    showStreetDetails: false,
    showPostcodeLabels: false,
    showMPs: false,
    showLastElectionData: false,
    boundaryOutlines: [AnalyticalAreaType.ParliamentaryConstituency_2024],
    showBoundaryNames: true,
  },
  starred: [],
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
    editedOutput: (
      draft: WritableDraft<
        Omit<MapReportExtended, 'layers'> & { layers: MapLayerInput[] }
      >
    ) => void
  ) => void
  updateLayer: (layerId: string, layer: Partial<MapLayerInput>) => void
  refreshReportData: () => void
  dataLoading: boolean
  setDataLoading: (loading: boolean) => void
  removeDataSource: (layerId: string) => void
  addDataSource: (layer: AddSourcePayload) => void
  addStarredItem(starredItemData: StarredState): void
  removeStarredItem(itemId: string): void
  clearAllStarredItems(): void
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
  addStarredItem: () => {},
  removeStarredItem: () => {},
  clearAllStarredItems: () => {},
})

export default ReportContext
