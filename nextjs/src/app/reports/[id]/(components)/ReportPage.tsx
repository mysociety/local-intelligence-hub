'use client'

import LocalisedMap from '@/components/LocalisedMap'
import { ConstituenciesPanel } from './ConstituenciesPanel'
import UKConstituencies from './MapLayers/UKConstituencies'
import { useReport } from './ReportProvider'

export default function ReportPage() {
  const { report } = useReport()

  return (
    <div className="absolute w-[-webkit-fill-available] h-full flex flex-row pointer-events-none">
      <div className="w-full h-full pointer-events-auto">
        <LocalisedMap
          showStreetDetails={report.displayOptions?.display?.streetDetails}
          initViewCountry="uk"
        >
          {/* <UKWards /> */}
          <UKConstituencies />
        </LocalisedMap>
      </div>
      <aside className="absolute top-0 right-0 p-5 w-[400px] h-full">
        <ConstituenciesPanel />
      </aside>
    </div>
  )
}
