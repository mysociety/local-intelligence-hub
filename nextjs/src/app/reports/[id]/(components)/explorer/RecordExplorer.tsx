import {
  RecordExplorerSummaryQuery,
  RecordExplorerSummaryQueryVariables,
} from '@/__generated__/graphql'
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { ExplorerState } from '@/lib/map'
import { gql, useQuery } from '@apollo/client'
import { LucideLink } from 'lucide-react'
import pluralize from 'pluralize'
import queryString from 'query-string'
import { useState } from 'react'
import { toast } from 'sonner'

export function RecordExplorer({ id }: { id: string }) {
  const [selectedTab, setSelectedTab] = useState('summary')

  // Query area details
  const data = useQuery<
    RecordExplorerSummaryQuery,
    RecordExplorerSummaryQueryVariables
  >(RECORD_EXPLORER_SUMMARY, {
    variables: { id },
    skip: !id,
  })

  const record = data.data?.import?.record

  return (
    <SidebarContent className="bg-meepGray-600 overflow-x-hidden">
      <SidebarHeader className="!text-white p-4 mb-0">
        <>
          <div className="text-xs labels-condensed text-meepGray-400 uppercase">
            {record?.dataType.dataSet.externalDataSource.dataType
              ? pluralize(
                  record?.dataType.dataSet.externalDataSource.dataType,
                  1
                )
              : 'Record'}
          </div>
          <div className="text-hMd flex flex-row gap-2 w-full items-center">
            {data.loading ? (
              <span className="text-meepGray-400">Loading...</span>
            ) : data.error || !record ? (
              <span className="text-meepGray-400">???</span>
            ) : (
              <>
                <span>
                  {record.title ||
                    record.fullName ||
                    `${record.firstName} ${record.lastName}`}
                </span>
                <LucideLink
                  onClick={copyUrl}
                  className="ml-auto text-meepGray-400 hover:text-meepGray-200 cursor-pointer"
                  size={16}
                />
              </>
            )}
          </div>
        </>
      </SidebarHeader>
      {/* <Tabs
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
        <TabsContent
          value="summary"
          className="pb-24 divide-y divide-meepGray-800"
        >
          <section className="flex flex-col gap-2 px-4">
            <div className="text-hSm text-white">Contact</div>
            <div className="flex flex-col gap-2"></div>
          </section>
        </TabsContent>
      </Tabs> */}
    </SidebarContent>
  )

  function copyUrl() {
    // clean URL
    const currentURL = window.location.href.split('?')[0]
    // add GSS code to URL
    const newURL = queryString.stringifyUrl({
      url: currentURL,
      query: {
        id,
        entity: 'record',
        showExplorer: true,
      } satisfies ExplorerState,
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

const RECORD_EXPLORER_SUMMARY = gql`
  query RecordExplorerSummary($id: String!) {
    import: importedDataGeojsonPoint(genericDataId: $id) {
      id
      record: properties {
        id
        dataType {
          id
          name
          dataSet {
            id
            externalDataSource {
              id
              name
              organisation {
                id
                name
              }
              crmType
              dataType
            }
          }
        }
        postcode
        title
        firstName
        lastName
        fullName
        email
        phone
        startTime
        endTime
        publicUrl
        address
        description
        json
      }
    }
  }
`
