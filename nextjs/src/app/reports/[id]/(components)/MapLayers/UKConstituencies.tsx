import { AnalyticalAreaType, GroupedDataCount } from '@/__generated__/graphql'
import { useLoadedMap } from '@/lib/map'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import { addCountByGssToMapboxLayer } from '../../addCountByGssToMapboxLayer'
import {
  getChoroplethEdge,
  getChoroplethFill,
  getSelectedChoroplethEdge,
} from '../../getChoroplethStyles'
import { getChoroplethFillFilter } from '../../logic'
import { Tileset } from '../../types'
import useBoundaryAnalytics from '../../useBoundaryAnalytics'
import useSelectBoundary, {
  selectedBoundaryAtom,
} from '../../useSelectBoundary'
import { useReport } from '../ReportProvider'

// https://studio.mapbox.com/tilesets/commonknowledge.bhg1h3hj
function getTileset(data: GroupedDataCount[]): Tileset {
  return {
    name: 'Constituencies',
    singular: 'constituency',
    mapboxSourceId: 'commonknowledge.bhg1h3hj',
    sourceLayerId: 'uk_cons_2025',
    promoteId: 'gss_code',
    labelId: 'name',
    data,
  }
}

const UKConstituencies = () => {
  const { report } = useReport()
  const countsByConstituency = useBoundaryAnalytics(
    report,
    AnalyticalAreaType.ParliamentaryConstituency_2024
  )
  const map = useLoadedMap()
  const [tileset, setTileset] = useState<Tileset | null>(null)
  useSelectBoundary(tileset)
  const selectedBoundary = useAtomValue(selectedBoundaryAtom)

  // Show the layer only if the report is set to show parliamentary constituencies
  const visibility =
    report.displayOptions?.dataVisualisation?.boundaryType ===
    AnalyticalAreaType.ParliamentaryConstituency_2024
      ? 'visible'
      : 'none'

  // When the map is loaded and we have the data, add the layer to the map
  useEffect(() => {
    if (map.loaded && countsByConstituency) {
      const tileset = getTileset(countsByConstituency)
      setTileset(tileset)
      addCountByGssToMapboxLayer(
        tileset.data,
        tileset.mapboxSourceId,
        tileset.sourceLayerId,
        map.loadedMap
      )
    }
  }, [map.loaded, countsByConstituency])

  if (!map.loaded) return null
  if (!countsByConstituency || !tileset) return null

  return (
    <>
      <Source
        id={tileset.mapboxSourceId}
        type="vector"
        url={`mapbox://${tileset.mapboxSourceId}`}
        promoteId={tileset.promoteId}
      >
        {/* Fill of the boundary */}
        <Layer
          beforeId="road-simple"
          id={`${tileset.mapboxSourceId}-fill`}
          source={tileset.mapboxSourceId}
          source-layer={tileset.sourceLayerId}
          type="fill"
          filter={getChoroplethFillFilter(tileset)}
          paint={getChoroplethFill(tileset.data)}
          layout={{ visibility }}
        />
        {/* Border of the boundary */}
        <Layer
          id={`${tileset.mapboxSourceId}-line`}
          source={tileset.mapboxSourceId}
          source-layer={tileset.sourceLayerId}
          type="line"
          paint={getChoroplethEdge()}
          layout={{ visibility, 'line-join': 'round', 'line-round-limit': 0.1 }}
        />
        {/* Selected boundary layer */}
        <Layer
          id={`${tileset.mapboxSourceId}-selected`}
          source={tileset.mapboxSourceId}
          source-layer={tileset.sourceLayerId}
          type="line"
          paint={getSelectedChoroplethEdge()}
          filter={['==', ['get', tileset.promoteId], selectedBoundary]}
          layout={{ visibility, 'line-join': 'round', 'line-round-limit': 0.1 }}
        />
      </Source>
    </>
  )
}

export default UKConstituencies
