import { GroupedDataCount } from '@/__generated__/graphql'
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
  const countsByWard = useDataSources(report, 'uk_westminster_wards')
  const map = useLoadedMap()
  const [tileset, setTileset] = useState<Tileset | null>(null)

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

  console.log(countsByWard)
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
        />
      </Source>
    </>
  )
}

export default UKWards
