import { AnalyticalAreaType, GroupedDataCount } from '@/__generated__/graphql'
import { useLoadedMap } from '@/lib/map'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import { addCountByGssToMapboxLayer } from '../../addCountByGssToMapboxLayer'
import { getChoroplethEdge, getChoroplethFill } from '../../getChoroplethStyles'
import { getChoroplethFillFilter } from '../../logic'
import { Tileset } from '../../types'
import useBoundaryAnalytics from '../../useBoundaryAnalytics'
import { selectedBoundaryAtom } from '../../useSelectBoundary'
import { useReport } from '../ReportProvider'

// https://studio.mapbox.com/tilesets/commonknowledge.3s92t1yc
function getTileset(data: GroupedDataCount[]): Tileset {
  return {
    name: 'Wards',
    singular: 'ward',
    mapboxSourceId: 'commonknowledge.3s92t1yc',
    sourceLayerId: 'converted_uk_wards_2025',
    promoteId: 'WD24CD',
    labelId: 'WD24NM',
    data,
  }
}

const UKWards = () => {
  const { report } = useReport()
  const countsByWard = useBoundaryAnalytics(
    report,
    AnalyticalAreaType.AdminWard
  )
  const map = useLoadedMap()
  const [tileset, setTileset] = useState<Tileset | null>(null)
  const selectedBoundary = useAtomValue(selectedBoundaryAtom)
  const visibility =
    report.displayOptions?.dataVisualisation?.boundaryType ===
    AnalyticalAreaType.AdminWard
      ? 'visible'
      : 'none'

  useEffect(() => {
    if (map.loaded && countsByWard) {
      const tileset = getTileset(countsByWard)
      setTileset(tileset)
      addCountByGssToMapboxLayer(
        tileset.data,
        tileset.mapboxSourceId,
        tileset.sourceLayerId,
        map.loadedMap
      )
    }
  }, [map.loaded, countsByWard])

  if (!map.loaded) return null
  if (!countsByWard || !tileset) return null

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
          paint={{
            'line-color': 'red',
            'line-width': 2,
          }}
          filter={['==', ['get', tileset.promoteId], selectedBoundary]}
          layout={{ visibility, 'line-join': 'round', 'line-round-limit': 0.1 }}
        />
      </Source>
    </>
  )
}

export default UKWards
