import { AnalyticalAreaType, GroupedDataCount } from '@/__generated__/graphql'
import { useLoadedMap } from '@/lib/map'
import { useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import { addCountByGssToMapboxLayer } from '../../addCountByGssToMapboxLayer'
import { getChoroplethFill } from '../../getChoroplethStyles'
import { getChoroplethFillFilter } from '../../logic'
import { Tileset } from '../../types'
import useBoundaryAnalytics from '../../useBoundaryAnalytics'
import { useReport } from '../ReportProvider'

// https://studio.mapbox.com/tilesets/...
function getTileset(data: GroupedDataCount[]): Tileset {
  return {
    name: '',
    singular: '',
    mapboxSourceId: '',
    sourceLayerId: '',
    promoteId: '',
    labelId: '',
    data,
  }
}

const UKLocalAuthorityDistricts = () => {
  const { report } = useReport()
  const countsByWard = useBoundaryAnalytics(
    report,
    AnalyticalAreaType.AdminDistrict
  )
  const map = useLoadedMap()
  const [tileset, setTileset] = useState<Tileset | null>(null)
  const visibility =
    report.displayOptions?.dataVisualisation?.boundaryType ===
    AnalyticalAreaType.AdminDistrict
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

  const choroplethColours = getChoroplethFill(tileset.data)
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
          id={`${tileset.mapboxSourceId}-fill`}
          source={tileset.mapboxSourceId}
          source-layer={tileset.sourceLayerId}
          type="fill"
          filter={getChoroplethFillFilter(tileset)}
          paint={choroplethColours}
          layout={{ visibility }}
        />
        {/* Border of the boundary */}
        <Layer
          id={`${tileset.mapboxSourceId}-line`}
          source={tileset.mapboxSourceId}
          source-layer={tileset.sourceLayerId}
          type="line"
          paint={{
            'line-color': 'white',
            'line-width': 0.5,
            'line-opacity': 0.5,
          }}
          layout={{ visibility }}
        />
      </Source>
    </>
  )
}

export default UKLocalAuthorityDistricts
