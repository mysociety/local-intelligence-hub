import { useAtom } from 'jotai'
import { useEffect, useRef } from 'react'

import { ConstituencyElectionDeepDive } from '@/app/reports/[id]/(components)/reportsConstituencyItem'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  constituencyPanelTabAtom,
  selectedConstituencyAtom,
} from '@/lib/map/state'

import { useReport } from './ReportProvider'
import { TopConstituencies } from './TopConstituencies'

export function ConstituenciesPanel() {
  const [selectedConstituencyId, setSelectedConstituency] = useAtom(
    selectedConstituencyAtom
  )
  const [tab, setTab] = useAtom(constituencyPanelTabAtom)
  const {
    report: {
      displayOptions: {
        dataVisualisation: { boundaryType: analyticalAreaType } = {},
      } = {},
    },
  } = useReport()

  const lastCons = useRef(selectedConstituencyId)
  useEffect(() => {
    if (selectedConstituencyId && selectedConstituencyId !== lastCons.current) {
      return setTab('selected')
    } else if (!selectedConstituencyId) {
      return setTab('list')
    }
  }, [selectedConstituencyId, setTab])

  if (!analyticalAreaType) return null

  return (
    <Card className="pt-4 bg-meepGray-800 border-1 text-meepGray-200 border border-meepGray-700 max-h-full flex flex-col pointer-events-auto">
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex flex-col max-h-full overflow-hidden items-start justify-start"
      >
        <TabsList className="mx-4">
          <TabsTrigger value="list">All Constituencies</TabsTrigger>
          {!!selectedConstituencyId && (
            <TabsTrigger value="selected">Selected</TabsTrigger>
          )}
        </TabsList>
        {/* Don't stretch, grow at most to height of window, scroll internally */}
        <div className="overflow-y-auto max-h-full px-4 w-full">
          <TabsContent value="list" className="pb-4">
            <TopConstituencies />
          </TabsContent>
          {!!selectedConstituencyId && (
            <TabsContent value="selected" className="pb-4">
              <ConstituencyElectionDeepDive
                gss={selectedConstituencyId}
                analyticalAreaType={analyticalAreaType}
              />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </Card>
  )
}
