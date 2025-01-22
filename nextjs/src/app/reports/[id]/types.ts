import { AnalyticalAreaType } from '@/__generated__/graphql'
import { LayerProps } from 'react-map-gl'

export type Tileset = {
  analyticalAreaType: AnalyticalAreaType
  name: string
  singular: string
  mapboxSourceId: string
  sourceLayerId?: string
  promoteId: string
  labelId: string
  mapboxLayerProps?: Omit<
    LayerProps,
    'type' | 'url' | 'id' | 'paint' | 'layout'
  >
  downloadUrl?: string
  minZoom: number
  maxZoom: number
  useBoundsInDataQuery?: boolean
}
