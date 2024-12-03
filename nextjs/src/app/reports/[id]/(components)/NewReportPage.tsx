'use client'

import LocalisedMap from '@/components/LocalisedMap'
import UKConstituencies from './MapLayers/UKConstituencies'
import { useReport } from './ReportProvider'

export default function ReportPage() {
  const { reportConfig } = useReport()

  return (
    <div className="w-full h-full pointer-events-auto">
      <LocalisedMap
        showStreetDetails={reportConfig?.showStreetDetails}
        initViewCountry="uk"
      >
        <UKConstituencies />
      </LocalisedMap>
    </div>
  )
}
