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
              <TabsTrigger value="starred" className={classes.tabsTrigger}>
                Starred
              </TabsTrigger>
            </TabsList>
            <TabsContent value="layers" className="px-4 pb-24">
              <ReportDataSources />
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
