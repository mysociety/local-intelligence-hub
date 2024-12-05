import { AnalyticalAreaType, GroupedDataCount } from '@/__generated__/graphql'
import { useLoadedMap } from '@/lib/map'
import { useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import { useReport } from '../ReportProvider'
import { addCountByGssToMapboxLayer } from './addCountByGssToMapboxLayer'
import { getChoroplethColours } from './getChoroplethColours'
import { Tileset } from './types'
import useDataSources from './useDataSources'

// https://studio.mapbox.com/tilesets/commonknowledge.0rzbo365
function getTileset(data: GroupedDataCount[]): Tileset {
  return {
    name: 'GE2024 wards',
    singular: 'ward',
    mapboxSourceId: 'commonknowledge.0rzbo365',
    sourceLayerId: 'Wards_Dec_2023_UK_Boundaries_-7wzb6g',
    promoteId: 'WD23CD',
    labelId: 'WD23NM',
    data,
  }
}

const UKWards = () => {
  const { report } = useReport()
  const countsByWard = useDataSources(report, AnalyticalAreaType.AdminWard)
  const map = useLoadedMap()
  const [tileset, setTileset] = useState<Tileset | null>(null)
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
      // TODO: change once we've updated to full zoom range tileset
      map.loadedMap?.setZoom(8)
    }
  }, [map.loaded, countsByWard])

  if (!countsByWard || !tileset) return null

  const onlyDrawWardsWithData = [
    'in',
    ['get', tileset.promoteId],
    ['literal', tileset.data.map((d) => d.gss || '')],
  ]
  const choroplethColours = getChoroplethColours(tileset.data)
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
          filter={onlyDrawWardsWithData}
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

export default UKWards
