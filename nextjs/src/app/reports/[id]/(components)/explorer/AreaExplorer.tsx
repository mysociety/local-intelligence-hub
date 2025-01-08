import {
  AreaExplorerSummaryQuery,
  AreaExplorerSummaryQueryVariables,
  AreaLayerDataQuery,
  AreaLayerDataQueryVariables,
  DataSourceType,
  MapLayer,
} from '@/__generated__/graphql'
import { DataSourceIcon } from '@/components/DataSourceIcon'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { gql, useQuery } from '@apollo/client'
import { LucideLink } from 'lucide-react'
import pluralize from 'pluralize'
import queryString from 'query-string'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import useReportUiHelpers from '../../useReportUiHelpers'
import { useReport } from '../ReportProvider'
import { TableDisplay } from '../dashboard/TableDisplay'

export function AreaExplorer({ gss }: { gss: string }) {
  const { userJourneyHelpers, updateUserJourneyHelpers } = useReportUiHelpers()
  const [selectedTab, setSelectedTab] = useState('summary')

  // Query area details
  const areaData = useQuery<
    AreaExplorerSummaryQuery,
    AreaExplorerSummaryQueryVariables
  >(AREA_EXPLORER_SUMMARY, {
    variables: { gss },
    skip: !gss,
  })

  const report = useReport()

  return (
    <SidebarContent className="bg-meepGray-600 overflow-x-hidden">
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
        <TabsContent
          value="summary"
          className="pb-24 divide-y divide-meepGray-800"
        >
          {report.report.layers?.map((layer) => (
            <div key={layer.id} className="my-4 px-4">
              <AreaLayerData layer={layer} gss={gss} />
            </div>
          )) || (
            <div className="text-xl text-meepGray-400 text-center py-12 px-2">
              No summary data available
            </div>
          )}
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

function AreaLayerData({ layer, gss }: { layer: MapLayer; gss: string }) {
  const data = useQuery<AreaLayerDataQuery, AreaLayerDataQueryVariables>(
    AREA_LAYER_DATA,
    {
      variables: { gss, externalDataSource: layer?.source?.id },
      skip: !layer?.source?.id,
    }
  )

  const displayData = useMemo(() => {
    const allData =
      data.data?.genericDataFromSourceAboutArea.map((d) => d.json) || []
    if (layer.source.dataType === DataSourceType.AreaStats) {
      // Create a single object with all numeric keys added up
      const summedData = allData.reduce((acc, curr) => {
        Object.keys(curr).forEach((key) => {
          const value = safeParseAsNumber(curr[key])
          if (typeof value === 'number') {
            acc[key] = (acc[key] || 0) + value
          }
        })
        return acc
      }, {})
      return summedData
    } else {
      return allData
    }
  }, [data, layer])

  return (
    <div className="flex flex-col gap-2 pt-4">
      <div className="text-hSm text-white">{layer.name}</div>
      <div className="flex flex-col gap-2">
        {data.loading ? (
          <div className="text-meepGray-400">
            <LoadingIcon size={'32px'} />
          </div>
        ) : data.error || !data.data?.genericDataFromSourceAboutArea ? (
          <div className="text-xl text-meepGray-400 text-center py-12 px-2">
            No data available for this area
          </div>
        ) : (
          <div className="text-meepGray-400">
            {/* {layer.inspectorType === InspectorDisplayType.Table ? ( */}
            <TableDisplay data={displayData} config={layer.inspectorConfig} />
            {/* ) : layer.inspectorType === InspectorDisplayType.ElectionResult ? (
              <ElectionResultsDisplay data={data.data.genericDataForArea} config={layer.inspectorConfig} />
            ) : layer.inspectorType === InspectorDisplayType.BigNumber ? (
              <BigNumberDisplay data={data.data.genericDataForArea} config={layer.inspectorConfig} />
            ) : (
              <ListDisplay data={data.data.genericDataForArea} config={layer.inspectorConfig} />
            )} */}
          </div>
        )}
        <div className="text-meepGray-400 text-sm flex flex-row items-center gap-1">
          Source:{' '}
          <DataSourceIcon crmType={layer.source.crmType} className="w-5 h-5" />{' '}
          {layer.source.name}
        </div>
      </div>
    </div>
  )
}

function safeParseAsNumber(value: any): number | null {
  try {
    if (typeof value === 'number') {
      return value
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      if (!isNaN(parsed)) {
        return parsed
      }
    }
    return null
  } catch (e) {
    return null
  }
}

const AREA_LAYER_DATA = gql`
  query AreaLayerData($gss: String!, $externalDataSource: String!) {
    genericDataFromSourceAboutArea(gss: $gss, sourceId: $externalDataSource) {
      json
    }
    genericDataSummaryFromSourceAboutArea(
      gss: $gss
      sourceId: $externalDataSource
    )
  }
`

function ElectionResultsDisplay({
  data,
  config,
}: {
  data: AreaLayerDataQuery['genericDataFromSourceAboutArea'][]
  config: {
    voteCountFields: string[]
  }
}) {
  // {/* Option:
  //   - UK political election result
  //     - so infer party colours
  //     - display FPTP majority
  //     - total votes
  //   - [ ] select vote count fields: Con, Grn, Lab, Oth, ...
  // */}
  return <div>Election results</div>
}

function BigNumberDisplay({
  data,
  config,
}: {
  data: AreaLayerDataQuery['genericDataFromSourceAboutArea'][]
  config: {
    columns: string[]
  }
}) {
  return <div>Big number</div>
}

function ListDisplay({
  data,
  config,
}: {
  data: AreaLayerDataQuery['genericDataFromSourceAboutArea'][]
  config: {
    columns: string[]
  }
}) {
  return (
    // Display a simple table of the data using ShadCDN
    null
  )
}
