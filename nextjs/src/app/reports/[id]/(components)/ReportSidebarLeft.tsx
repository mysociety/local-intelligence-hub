import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { layerEditorStateAtom } from '@/lib/map'
import { useDebounce } from '@uidotdev/usehooks'
import { useAtom } from 'jotai'
import { useEffect, useState } from 'react'
import useReportUiHelpers from '../useReportUiHelpers'
import { DataSourceEditor } from './DataSourceEditor'
import InactivateOnLoading from './InactivateOnLoading'
import ReportConfiguration from './ReportConfiguration'
import { ReportDataSources } from './ReportDataSources'
import { NAVBAR_HEIGHT } from './ReportNavbar'
import { useReport } from './ReportProvider'

const classes = {
  tabsTrigger:
    'pb-2 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b border-white rounded-none',
}

export const LEFT_SIDEBAR_WIDTH = 350

export function ReportSidebarLeft() {
  const { userJourneyHelpers, updateUserJourneyHelpers } = useReportUiHelpers()
  const { dataLoading: undebouncedDataLoading } = useReport()
  const [selectedTab, setSelectedTab] = useState('data-sources')
  const [layerEditorState, setLayerEditorState] = useAtom(layerEditorStateAtom)
  const dataLoading = useDebounce(undebouncedDataLoading, 300)

  useEffect(() => {
    if (selectedTab !== 'data-sources') {
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
            defaultValue="data-sources"
            className="w-full"
            onValueChange={setSelectedTab}
          >
            <TabsList
              className="w-full justify-start text-white rounded-none px-4
              border border-b-meepGray-800 pt-4 pb-0 h-fit flex gap-4"
            >
              <TabsTrigger
                value="data-sources"
                className={classes.tabsTrigger}
                disabled={dataLoading}
              >
                Data Sources {}
              </TabsTrigger>

              <HoverCard
                open={
                  userJourneyHelpers?.visualiseYourData.open &&
                  selectedTab === 'data-sources'
                }
                onOpenChange={() =>
                  updateUserJourneyHelpers('visualiseYourData', false)
                }
              >
                <HoverCardTrigger>
                  <TabsTrigger
                    value="configuration"
                    className={classes.tabsTrigger}
                    disabled={dataLoading}
                  >
                    Configuration
                  </TabsTrigger>
                </HoverCardTrigger>
                <HoverCardContent align="start" className="font-normal">
                  Click on "Configuration" to visualise your data
                </HoverCardContent>
              </HoverCard>
            </TabsList>
            <TabsContent value="data-sources" className="px-4 pb-24">
              <InactivateOnLoading>
                <ReportDataSources />
              </InactivateOnLoading>
            </TabsContent>
            <TabsContent value="configuration" className="px-4 pb-24">
              <InactivateOnLoading>
                <ReportConfiguration />
              </InactivateOnLoading>
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
