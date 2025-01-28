import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { layerEditorStateAtom } from '@/lib/map'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import useReportUiHelpers from '../useReportUiHelpers'
import { DataSourceEditor } from './DataSourceEditor'
import { ReportDataSources } from './ReportDataSources'
import { NAVBAR_HEIGHT } from './ReportNavbar'
import ReportStarredItems from './ReportStarredItems'
import ReportVisualisation from './ReportVisualisation'

const classes = {
  tabsTrigger:
    'pb-2 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b border-white rounded-none',
}

export const LEFT_SIDEBAR_WIDTH = 350

export function ReportSidebarLeft() {
  const { userJourneyHelpers, updateUserJourneyHelpers } = useReportUiHelpers()
  const [selectedTab, setSelectedTab] = useState('layers')
  const [layerEditorState, setLayerEditorState] = useAtom(layerEditorStateAtom)

  useEffect(() => {
    if (selectedTab !== 'layers') {
      setLayerEditorState({ open: false })
    }
  }, [selectedTab])

  return (
    <Sidebar
      style={{
        top: NAVBAR_HEIGHT + 'px',
      }}
      className="border border-r-meepGray-800 overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      collapsible="offcanvas"
    >
      <Sidebar
        id="primary-sidebar"
        collapsible="none"
        style={{
          width: LEFT_SIDEBAR_WIDTH,
        }}
      >
        <SidebarContent className="bg-meepGray-600">
          <Tabs
            defaultValue="layers"
            className="w-full"
            onValueChange={setSelectedTab}
          >
            <TabsList
              className="w-full justify-start text-white rounded-none px-4
              border border-b-meepGray-800 pt-4 pb-0 h-fit flex gap-4"
            >
              <TabsTrigger value="layers" className={classes.tabsTrigger}>
                Layers
              </TabsTrigger>

              <HoverCard
                open={
                  userJourneyHelpers?.visualiseYourData.open &&
                  selectedTab === 'layers'
                }
                onOpenChange={() =>
                  updateUserJourneyHelpers('visualiseYourData', false)
                }
              >
                <HoverCardTrigger>
                  <TabsTrigger
                    value="data visualisation"
                    className={classes.tabsTrigger}
                  >
                    Data visualisation
                  </TabsTrigger>
                </HoverCardTrigger>
                <HoverCardContent align="start" className="font-normal">
                  Click on "Configuration" to visualise your data
                </HoverCardContent>
              </HoverCard>

              <TabsTrigger value="starred" className={classes.tabsTrigger}>
                Starred
              </TabsTrigger>
            </TabsList>
            <TabsContent value="layers" className="px-4 pb-24">
              <ReportDataSources />
            </TabsContent>
            <TabsContent value="data visualisation" className="px-4 pb-24">
              <div className="flex flex-col gap-2">
                <ReportVisualisation />
              </div>
            </TabsContent>
            <TabsContent value="starred" className="px-4 pb-24">
              <ReportStarredItems />
            </TabsContent>
          </Tabs>
        </SidebarContent>
      </Sidebar>

      {layerEditorState.open && (
        <Sidebar
          id="secondary-sidebar"
          collapsible="none"
          className="w-full"
          style={{
            width: LEFT_SIDEBAR_WIDTH,
          }}
        >
          <SidebarContent className="bg-meepGray-800">
            <DataSourceEditor />
          </SidebarContent>
        </Sidebar>
      )}
    </Sidebar>
  )
}
