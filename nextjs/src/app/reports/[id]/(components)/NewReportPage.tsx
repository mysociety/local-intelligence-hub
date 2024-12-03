'use client'

import LocalisedMap from '@/components/LocalisedMap'
import { ConstituenciesPanel } from './ConstituenciesPanel'
import LayersCard from './LayersCard'
import UKConstituencies from './MapLayers/UKConstituencies'
import { useReport } from './ReportProvider'

export default function ReportPage() {
  const { report } = useReport()

  return (
    <div className="absolute w-full h-full flex flex-row pointer-events-none">
      <div className="w-full h-full pointer-events-auto">
        <LocalisedMap
          showStreetDetails={report?.displayOptions.showStreetDetails}
          initViewCountry="uk"
        >
          {/* <UKWards /> */}
          <UKConstituencies />
        </LocalisedMap>
      </div>
      <aside className="absolute top-0 left-0 p-5 w-[300px] h-full pointer-events-auto">
        <LayersCard />
      </aside>
      <aside className="absolute top-0 right-0 p-5 w-[400px] h-full">
        <ConstituenciesPanel />
      </aside>
    </div>
  )
}
