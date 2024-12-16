import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDebounce } from '@uidotdev/usehooks'
import clsx from 'clsx'
import useReportUiHelpers from '../useReportUiHelpers'
import ReportConfiguration from './ReportConfiguration'
import { ReportDataSources } from './ReportDataSources'
import { NAVBAR_HEIGHT } from './ReportNavbar'
import { useReport } from './ReportProvider'

const classes = {
  tabsTrigger:
    'pb-2 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b border-white rounded-none',
}

export function ReportSidebarLeft() {
  const { userJourneyHelpers, updateUserJourneyHelpers } = useReportUiHelpers()
  const { dataLoading: undebouncedDataLoading } = useReport()
  const dataLoading = useDebounce(undebouncedDataLoading, 300)

  return (
    <Sidebar
      style={{
        top: NAVBAR_HEIGHT + 'px',
      }}
      className="border border-r-meepGray-800"
    >
      <SidebarContent className="bg-meepGray-600">
        <Tabs defaultValue="data-sources" className="w-full">
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
              open={userJourneyHelpers?.visualiseYourData.open}
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
          <TabsContent value="data-sources" className="">
            <div id="sources-loading-indicator">
              <div
                className={clsx(
                  'flex flex-col px-4 pb-24 transition',
                  dataLoading ? 'blur-md grayscale pointer-events-none' : ''
                )}
              >
                <ReportDataSources />
              </div>
              <div
                className={clsx(
                  'absolute top-0 w-full h-[300px] flex flex-col justify-center items-center',
                  dataLoading ? 'flex' : 'hidden'
                )}
              >
                <p className="text-white">Loading data source...</p>
                <LoadingIcon className="w-20 h-20 mt-4" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="configuration" className="px-4 pb-24">
            <ReportConfiguration />
          </TabsContent>
        </Tabs>
      </SidebarContent>
    </Sidebar>
  )
}
