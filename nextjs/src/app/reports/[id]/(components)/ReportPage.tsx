'use client'

import LocalisedMap from '@/components/LocalisedMap'
import { PlaceholderLayer } from '@/components/PlaceholderLayer'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { useActiveTileset, useMapBounds } from '@/lib/map'
import { useEffect } from 'react'
import { POLITICAL_BOUNDARIES } from '../politicalTilesets'
import useDataByBoundary from '../useDataByBoundary'
import PoliticalChoropleths from './MapLayers/PoliticalChoropleths'
import ReportMapMarkers from './MapLayers/ReportMapMarkers'
import { useReport } from './ReportProvider'

export const PLACEHOLDER_LAYER_ID_CHOROPLETH = 'choropleths'
export const PLACEHOLDER_LAYER_ID_MARKERS = 'markers'

export default function ReportPage() {
  const { report } = useReport()
  const boundaryType = report.displayOptions?.dataVisualisation?.boundaryType
  const tilesets = POLITICAL_BOUNDARIES.find(
    (boundary) => boundary.boundaryType === boundaryType
  )?.tilesets

  const activeTileset = useActiveTileset(boundaryType)

  const { loading, fetchMore } = useDataByBoundary({
    report,
    tileset: activeTileset,
  })

  const [mapBounds] = useMapBounds()

  // Fetch more data when the map bounds change
  // This has to be here for the loading indicator to work
  // (fetchMore only triggers loading: true in its local hook)
  useEffect(() => {
    if (activeTileset.useBoundsInDataQuery) {
      fetchMore({
        variables: { mapBounds },
      })
    }
  }, [mapBounds, report?.displayOptions.dataVisualisation, activeTileset])

  return (
    <div className="absolute w-[-webkit-fill-available] h-full flex flex-row pointer-events-none">
      <div className="w-full h-full pointer-events-auto">
        {loading && (
          <div className="absolute bottom-12 right-0 z-10 p-4">
            <LoadingIcon size={'50'} />
          </div>
        )}
        <LocalisedMap
          showStreetDetails={report.displayOptions?.display?.showStreetDetails}
          initViewCountry="uk"
          mapKey={report.id}
        >
          <PlaceholderLayer id={PLACEHOLDER_LAYER_ID_CHOROPLETH} />
          {tilesets && tilesets.length && boundaryType && (
            <PoliticalChoropleths
              key={`${boundaryType}-${tilesets[0].mapboxSourceId}`}
              report={report}
              boundaryType={boundaryType}
              tilesets={tilesets}
            />
          )}
          <PlaceholderLayer id={PLACEHOLDER_LAYER_ID_MARKERS} />
          <ReportMapMarkers />
        </LocalisedMap>
      </div>
    </div>
  )
}
