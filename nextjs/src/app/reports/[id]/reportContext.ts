import {
  AreaQueryMode,
  ChoroplethMode,
  DataSourceType,
  GetMapReportQuery,
} from '@/__generated__/graphql'
import { InspectorDisplayType } from '@/lib/explorer'
import { starredSchema } from '@/lib/map'
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
import { createContext } from 'react'
import * as uuid from 'uuid'
import * as z from 'zod'
import { BoundaryType } from './politicalTilesets'

export enum ViewType {
  Map = 'Map',
  Table = 'Table',
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

export function getReportPalette(mapOptions: IMapOptions) {
  const interpolator =
    PALETTE[mapOptions.choropleth?.palette || Palette.Blue].interpolator
  if (mapOptions.choropleth?.isPaletteReversed) {
    return (t: number) => interpolator(1 - t)
  }
  return interpolator
}

export type MapReportWithoutJSON = Omit<
  GetMapReportQuery['mapReport'],
  'displayOptions'
>

export type MapReportWithTypedJSON = MapReportWithoutJSON & {
  displayOptions: IDisplayOptions
}

export enum DataDisplayMode {
  Aggregated = 'Aggregated',
  RawData = 'RawData',
}

export const explorerDisplaySchema = z.object({
  id: z.string().uuid().default(uuid.v4),
  layerId: z.string().uuid(),
  name: z.string().optional(),
  displayType: z
    .nativeEnum(InspectorDisplayType)
    .default(InspectorDisplayType.Properties),
  areaQueryMode: z.nativeEnum(AreaQueryMode).default(AreaQueryMode.Overlapping),
  dataDisplayMode: z.nativeEnum(DataDisplayMode).optional(),
  dataSourceType: z
    .nativeEnum(DataSourceType)
    .optional()
    .describe('Ask the display to present the data as if it was another type.'),
})

export type IExplorerDisplay = z.infer<typeof explorerDisplaySchema>

export const viewSchema = z.object({
  id: z.string().uuid().default(uuid.v4),
  name: z.string().optional(),
  type: z.nativeEnum(ViewType),
  description: z.string().optional(),
  icon: z.string().optional(),
  colour: z.string().optional(),
})

export type IView = z.infer<typeof viewSchema>

export const mapLayerSchema = z.object({
  // TODO: these could all be a union of simple or conditional styling
  id: z.string().uuid().default(uuid.v4).describe('View layer ID'),
  name: z.string().optional().describe('Name of the map marker layer'),
  layerId: z
    .string()
    .uuid()
    .describe('Reference to the report layer ID that it gets its data from'),
  colour: z
    .string()
    .optional()
    .describe('Standard colour for markers, highlighting, and so on.'),
  markerSize: z.number().optional().describe('Size of markers in pixels.'),
})

const mapOptionsSchema = z.object({
  choropleth: z
    .object({
      boundaryType: z
        .nativeEnum(BoundaryType)
        .default(BoundaryType.PARLIAMENTARY_CONSTITUENCIES),
      palette: z.nativeEnum(Palette).default(Palette.Inferno),
      isPaletteReversed: z.boolean().optional(),
      layerId: z.string().uuid().optional(),
      mode: z.nativeEnum(ChoroplethMode).default(ChoroplethMode.Count),
      field: z.string().optional(),
      formula: z.string().optional(),
    })
    .optional()
    .default({}),
  display: z
    .object({
      choropleth: z.boolean().default(true),
      borders: z.boolean().default(true),
      boundaryNames: z.boolean().default(true),
      streetDetails: z.boolean().optional(),
    })
    .default({}),
  layers: z
    .record(z.string().uuid().describe('View layer ID'), mapLayerSchema)
    .default({}),
})

export type IMapOptions = z.infer<typeof mapOptionsSchema>

const tableOptionsSchema = z.object({})

export const mapViewSchema = viewSchema.extend({
  type: z.literal(ViewType.Map),
  mapOptions: mapOptionsSchema.default({}),
})

export const tableViewSchema = viewSchema.extend({
  type: z.literal(ViewType.Table),
  tableOptions: tableOptionsSchema.default({}),
})

export const viewUnionSchema = z.discriminatedUnion('type', [
  mapViewSchema,
  tableViewSchema,
])

export type ViewConfig = z.infer<typeof viewUnionSchema>

// Make a version of the ViewConfig type which is generic so that providing <ViewType> asserts the union type:
export type SpecificViewConfig<ViewType> = ViewConfig & { type: ViewType }

const CURRENT_MIGRATION_VERSION = '2025-01-25'

const defaultViewId = uuid.v4()

export const displayOptionsSchema = z.object({
  version: z.string().default(CURRENT_MIGRATION_VERSION),
  starred: z.record(z.string(), starredSchema).default({}),
  areaExplorer: z
    .object({
      displays: z.record(z.string().uuid(), explorerDisplaySchema).default({}),
    })
    .default({}),
  recordExplorer: z
    .object({
      includeProperties: z
        .array(z.string())
        .optional()
        .describe('List of properties to show in the record explorer.'),
    })
    .default({}),
  views: z
    .record(z.string().uuid(), viewUnionSchema)
    .refine(
      (data) => Object.keys(data).length > 0,
      'Required at least one view required'
    )
    .default({
      [defaultViewId]: viewUnionSchema.parse({
        id: defaultViewId,
        type: ViewType.Map,
        mapOptions: mapOptionsSchema.parse({}),
      }),
    }),
})

export type IDisplayOptions = z.infer<typeof displayOptionsSchema>

export const defaultIDisplayOptions: IDisplayOptions =
  displayOptionsSchema.parse({})

export type AddSourcePayload = {
  name: string
  id: string
  dataType: DataSourceType
}

export interface ReportContextProps {
  report: MapReportWithTypedJSON
}

const ReportContext = createContext<ReportContextProps>({
  report: {} as MapReportWithTypedJSON,
})

export default ReportContext
