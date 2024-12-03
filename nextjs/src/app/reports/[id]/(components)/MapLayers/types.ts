import { GroupedDataCount } from '@/__generated__/graphql'
import { LayerProps } from 'react-map-gl'

export type Tileset = {
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
  data: GroupedDataCount[]
  downloadUrl?: string
}
