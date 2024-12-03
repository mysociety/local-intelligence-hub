import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { AddMapLayerButton } from '@/components/report/AddMapLayerButton'
import { Button } from '@/components/ui/button'
import { ChevronsUpDown } from 'lucide-react'
import useDataSources from '../useDataSources'
import DataSourcesList from './DataSourcesList'

const classes = {
  tabsTrigger:
    'pb-2 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b border-white rounded-none',
}

export function ReportSidebarLeft() {
  const { addDataSource } = useDataSources()

  return (
    <Sidebar className="top-[48px]  border border-r-meepGray-800">
      <SidebarContent className="bg-meepGray-600">
        <Tabs defaultValue="data-sources" className="w-full">
          <TabsList
            className="w-full justify-start text-white rounded-none pl-2
          border border-b-meepGray-800 pt-4 pb-0 h-fit flex gap-4"
          >
            <TabsTrigger value="data-sources" className={classes.tabsTrigger}>
              Data Sources
            </TabsTrigger>
            <TabsTrigger value="configuration" className={classes.tabsTrigger}>
              Configuration
            </TabsTrigger>
          </TabsList>
          <TabsContent value="data-sources" className="p-2">
            <Collapsible defaultOpen>
              <div className="flex flex-row items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-9 p-0">
                    <ChevronsUpDown className="h-4 w-4 text-white" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
                <h3 className="text-white font-bold">Data Sources</h3>
              </div>
              <p className="text-meepGray-300 text-sm mb-3  ">
                Connect your own custom data sources or select data sources from
                our library.
              </p>
              <CollapsibleContent>
                <DataSourcesList />
              </CollapsibleContent>
              <div className="flex gap-2 items-center mt-1">
                <AddMapLayerButton addLayer={addDataSource} />
              </div>
            </Collapsible>
          </TabsContent>
          <TabsContent value="configuration" className="p-2">
            Change your password here.
          </TabsContent>
        </Tabs>
      </SidebarContent>
    </Sidebar>
  )
}
