'use client'

import LocalisedMap from '@/components/LocalisedMap'
import { getTilesetsByCountry } from '../mapboxTilesets'
import { ConstituenciesPanel } from './ConstituenciesPanel'
import PoliticalChoropleths from './MapLayers/PoliticalChoropleths'
import ReportMapMarkers from './MapLayers/ReportMapMarkers'
import { useReport } from './ReportProvider'

export default function ReportPage() {
  const { report } = useReport()

  return (
    <div className="absolute w-[-webkit-fill-available] h-full flex flex-row pointer-events-none">
      <div className="w-full h-full pointer-events-auto">
        <LocalisedMap
          showStreetDetails={report.displayOptions?.display?.showStreetDetails}
          initViewCountry="uk"
          mapKey={report.id}
        >
          {getTilesetsByCountry('uk').map(([boundaryType, tileset]) => (
            <PoliticalChoropleths
              key={boundaryType}
              report={report}
              boundaryType={boundaryType}
              tileset={tileset}
            />
          ))}
          <ReportMapMarkers />
        </LocalisedMap>
      </div>
      <aside className="absolute top-0 right-0 p-5 w-[400px] h-full">
        <ConstituenciesPanel />
      </aside>
    </div>
  )
}
