import {
  AnalyticalAreaType,
  MapReportConstituencyStatsQuery,
  MapReportConstituencyStatsQueryVariables,
} from '@/__generated__/graphql'
import { useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import { MAP_REPORT_CONSTITUENCY_STATS } from '../../gql_queries'
import { useReport } from '../ReportProvider'
import { getChoroplethPaintObject } from './getChoroplethPaintObject'
import { Tileset } from './types'

// https://studio.mapbox.com/tilesets/commonknowledge.bhg1h3hj
const tileset: Tileset = {
  name: 'GE2024 constituencies',
  singular: 'constituency',
  mapboxSourceId: 'commonknowledge.bhg1h3hj',
  sourceLayerId: 'uk_cons_2025',
  promoteId: 'gss_code',
  labelId: 'name',
  data: [],
}

const UKConstituencies = () => {
  const { report } = useReport()
  const [canQuery, setCanQuery] = useState(false)

  useEffect(() => {
    if (report) {
      setCanQuery(true)
    }
  }, [report])

  const constituencyAnalytics = useQuery<
    MapReportConstituencyStatsQuery,
    MapReportConstituencyStatsQueryVariables
  >(MAP_REPORT_CONSTITUENCY_STATS, {
    variables: {
      reportID: report?.id,
      analyticalAreaType: AnalyticalAreaType.ParliamentaryConstituency_2024,
    },
    skip: !canQuery,
  })

  const data =
    constituencyAnalytics.data?.mapReport.importedDataCountByConstituency

  if (!data) return null

  const inDataFilter = [
    'in',
    ['get', tileset.promoteId],
    ['literal', data.map((d) => d.gss || '')],
  ]

  return (
    <>
      <Source
        id={tileset.mapboxSourceId}
        type="vector"
        url={`mapbox://${tileset.mapboxSourceId}`}
        promoteId={tileset.promoteId}
      >
        <Layer
          id={`${tileset.mapboxSourceId}-fill`}
          source={tileset.mapboxSourceId}
          source-layer={tileset.sourceLayerId}
          type="fill"
          filter={inDataFilter}
          paint={getChoroplethPaintObject(tileset)}
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

export default UKConstituencies

function getMembersByBoundaryType(
  data: MapReportConstituencyStatsQuery['mapReport']['importedDataCountByConstituency'],
  gss: string
) {
  return data.find((d) => d.gss === gss)
}
