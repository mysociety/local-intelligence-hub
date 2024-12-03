'use client'

import LocalisedMap from '@/components/LocalisedMap'
import { ConstituenciesPanel } from './ConstituenciesPanel'
import LayersCard from './LayersCard'
import UKConstituencies from './MapLayers/UKConstituencies'
import { useReport } from './ReportProvider'

export default function ReportPage() {
  const { reportConfig } = useReport()

  return (
    <div className="absolute w-full h-full flex flex-row pointer-events-none">
      <div className="w-full h-full pointer-events-auto">
        <LocalisedMap
          showStreetDetails={reportConfig?.showStreetDetails}
          initViewCountry="uk"
        >
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
// ;<>
//   <div className="absolute w-full h-full flex flex-row pointer-events-none">
//     <div className="w-full h-full pointer-events-auto">
//       <ReportMap />
//     </div>
//     <aside className="absolute top-0 left-0 p-5 w-[200px] h-full pointer-events-auto">
//       <LayersCard />
//     </aside>
//     {report?.data?.mapReport && isConstituencyPanelOpen && (
//       <aside className="absolute top-0 right-0 p-5 w-[400px] h-full">
//         <ConstituenciesPanel />
//       </aside>
//     )}
//   </div>
// </>
