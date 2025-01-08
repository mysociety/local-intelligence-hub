import {
  AreaExplorerSummaryQuery,
  AreaExplorerSummaryQueryVariables,
} from '@/__generated__/graphql'
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { gql, useQuery } from '@apollo/client'
import { LucideLink } from 'lucide-react'
import pluralize from 'pluralize'
import queryString from 'query-string'
import { useState } from 'react'
import { toast } from 'sonner'
import useReportUiHelpers from '../../useReportUiHelpers'

export function AreaExplorer({ gss }: { gss: string }) {
  const { userJourneyHelpers, updateUserJourneyHelpers } = useReportUiHelpers()
  const [selectedTab, setSelectedTab] = useState('data-sources')

  // Query area details
  const areaData = useQuery<
    AreaExplorerSummaryQuery,
    AreaExplorerSummaryQueryVariables
  >(AREA_EXPLORER_SUMMARY, {
    variables: { gss },
    skip: !gss,
  })

  return (
    <SidebarContent className="bg-meepGray-600">
      <SidebarHeader className="!text-white p-4 mb-0">
        <>
          <div className="text-xs labels-condensed text-meepGray-400 uppercase">
            {areaData.data?.area?.areaType.name
              ? pluralize(areaData.data?.area?.areaType.name, 1)
              : 'Area'}
          </div>
          <div className="text-hMd flex flex-row gap-2 w-full items-center">
            {areaData.loading ? (
              <span className="text-meepGray-400">Loading...</span>
            ) : areaData.error || !areaData.data?.area ? (
              <span className="text-meepGray-400">???</span>
            ) : (
              <>
                <span>{areaData.data?.area?.name}</span>
                <LucideLink
                  onClick={copyAreaURL}
                  className="ml-auto text-meepGray-400 hover:text-meepGray-200 cursor-pointer"
                  size={16}
                />
              </>
            )}
          </div>
        </>
      </SidebarHeader>
      <Tabs
        defaultValue="summary"
        className="w-full"
        onValueChange={setSelectedTab}
        value={selectedTab}
      >
        <TabsList
          className="w-full justify-start text-white rounded-none px-4
        border border-b-meepGray-800 pt-4 pb-0 h-fit flex gap-4"
        >
          <TabsTrigger value="summary" className={classes.tabsTrigger}>
            Summary
          </TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="px-4 pb-24">
          <div className="text-xl text-meepGray-400 text-center py-12 px-2">
            No summary data available
          </div>
        </TabsContent>
      </Tabs>
    </SidebarContent>
  )

  function copyAreaURL() {
    // clean URL
    const currentURL = window.location.href.split('?')[0]
    // add GSS code to URL
    const newURL = queryString.stringifyUrl({
      url: currentURL,
      query: { gss, entity: 'area', showExplorer: true },
    })
    // copy to clipboard
    navigator.clipboard.writeText(newURL)
    // alert the user
    toast.success('URL copied to clipboard')
  }
}

const classes = {
  tabsTrigger:
    'pb-2 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b border-white rounded-none',
}

const AREA_EXPLORER_SUMMARY = gql`
  query AreaExplorerSummary($gss: String!) {
    area(gss: $gss) {
      name
      areaType {
        name
        description
      }
    }
  }
`
