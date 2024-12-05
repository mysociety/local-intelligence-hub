import { Tileset } from './types'

export const getChoroplethFillFilter = (tileset: Tileset) => {
  return [
    'in',
    ['get', tileset.promoteId],
    ['literal', tileset.data.map((d) => d.gss || '')],
  ]
}

export const getSelectedChoropletFillFilter = (
  tileset: Tileset,
  selectedGss: string
) => {
  return ['==', ['get', tileset.promoteId], selectedGss]
}
