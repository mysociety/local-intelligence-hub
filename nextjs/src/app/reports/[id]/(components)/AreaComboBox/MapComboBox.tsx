'use client'

import { useView } from '@/lib/map/useView'
import { POLITICAL_BOUNDARIES } from '../../politicalTilesets'
import { ViewType } from '../../reportContext'
import { useAreasList } from '../../useAreasList'
import { AreaComboBox } from './AreaComboBox'

export default function MapComboBox() {
  const view = useView(ViewType.Map)
  const boundaryType =
    view.currentViewOfType?.mapOptions.choropleth?.boundaryType
  const selectedBoundaryLabel = POLITICAL_BOUNDARIES.find(
    (boundary) => boundary.boundaryType === boundaryType
  )?.label

  const areas = useAreasList(boundaryType)

  return (
    <AreaComboBox
      areas={areas}
      selectedBoundaryLabel={selectedBoundaryLabel || 'areas'}
    />
  )
}
