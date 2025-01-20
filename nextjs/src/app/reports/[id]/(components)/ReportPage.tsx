'use client'

import LocalisedMap from '@/components/LocalisedMap'
import { PlaceholderLayer } from '@/components/PlaceholderLayer'
import { LoadingIcon } from '@/components/ui/loadingIcon'
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
  const tileset = POLITICAL_BOUNDARIES.find(
    (boundary) => boundary.boundaryType === boundaryType
  )?.tileset

  const { loading: politicalChoroplethsLoading } = useDataByBoundary({
    report,
    boundaryType,
  })

  return (
    <div className="absolute w-[-webkit-fill-available] h-full flex flex-row pointer-events-none">
      <div className="w-full h-full pointer-events-auto">
        {politicalChoroplethsLoading && (
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
          {/* We load and populate all available political boundaries first, then toggle their visibility later.
          This prevents re-rendering and re-initialisting the layers and re-calculating stats when a user
          just wants to change the visible boundary type */}
          {tileset && boundaryType && (
            <PoliticalChoropleths
              key={`${boundaryType}-${tileset.mapboxSourceId}`}
              report={report}
              boundaryType={boundaryType}
              tileset={tileset}
            />
          )}
          {/* ))} */}
          <PlaceholderLayer id={PLACEHOLDER_LAYER_ID_MARKERS} />
          <ReportMapMarkers />
        </LocalisedMap>
      </div>
    </div>
  )
}
