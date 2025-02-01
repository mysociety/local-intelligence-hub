import {
  AreaExplorerSummaryQuery,
  AreaExplorerSummaryQueryVariables,
  AreaLayerDataQuery,
  AreaLayerDataQueryVariables,
  AreaQueryMode,
  DataSourceType,
} from '@/__generated__/graphql'
import { DataSourceIcon } from '@/components/DataSourceIcon'
import { DataSourceTypeIcon } from '@/components/icons/DataSourceType'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { SidebarContent, SidebarHeader } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InspectorDisplayType } from '@/lib/explorer'
import { contentEditableMutation } from '@/lib/html'
import { ExplorerAreaBreadCrumbMapping } from '@/lib/map'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import { gql, useQuery } from '@apollo/client'
import { format } from 'd3-format'
import { cloneDeep } from 'lodash'
import {
  ArrowLeft,
  ArrowRight,
  LucideLink,
  MapPinIcon,
  PencilIcon,
  Star,
  TargetIcon,
} from 'lucide-react'
import pluralize from 'pluralize'
import queryString from 'query-string'
import { Fragment, useEffect, useState } from 'react'
import { toast } from 'sonner'
import toSpaceCase from 'to-space-case'
import trigramSimilarity from 'trigram-similarity'
import { v4 } from 'uuid'
import { BoundaryType, dbAreaTypeToBoundaryType } from '../../politicalTilesets'
import {
  DataDisplayMode,
  IExplorerDisplay,
  StarredState,
  ViewType,
  explorerDisplaySchema,
} from '../../reportContext'
import CollapsibleSection from '../CollapsibleSection'
import { EditorSelect } from '../EditorSelect'
import { EditorSwitch } from '../EditorSwitch'
import { PropertiesDisplay } from '../dashboard/PropertiesDisplay'
import { TableDisplay } from '../dashboard/TableDisplay'
import { DisplayCreator } from './AreaExplorerDisplayCreator'

import { ExplorerState, useExplorer } from '@/lib/map/useExplorer'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function AreaExplorer({ gss }: { gss: string }) {
  const [selectedTab, setSelectedTab] = useState('summary')
  const explorer = useExplorer()
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 100,
      },
    })
  )

  // Query area details
  const areaData = useQuery<
    AreaExplorerSummaryQuery,
    AreaExplorerSummaryQueryVariables
  >(AREA_EXPLORER_SUMMARY, {
    variables: { gss },
    skip: !gss,
  })

  const boundaryType = areaData.data?.area?.areaType.code
    ? dbAreaTypeToBoundaryType(areaData.data?.area?.areaType.code)
    : undefined

  const mapView = useView(ViewType.Map)

  // useEffect(() => {
  //   if (boundaryType) {
  //     mapView.updateView((draft) => {
  //       draft.mapOptions.choropleth.boundaryType = boundaryType
  //     })
  //   }
  // }, [areaData, boundaryType])

  const report = useReport()
  const { addStarredItem, removeStarredItem } = report
  const starredItemData: StarredState = {
    id: gss || '',
    entity: 'area',
    showExplorer: true,
    name: areaData.data?.area?.name || '',
  }

  return (
    <SidebarContent className="bg-meepGray-600 overflow-x-hidden h-full">
      <SidebarHeader className="!text-white p-4 mb-0">
        <>
          <AreaExplorerBreadcrumbs area={areaData.data?.area} />
          <div className="text-hMd flex flex-row gap-2 w-full items-center">
            {areaData.loading ? (
              <span className="text-meepGray-400">Loading...</span>
            ) : areaData.error || !areaData.data?.area ? (
              <span className="text-meepGray-400">???</span>
            ) : (
              <>
                <span className="mr-auto">{areaData.data?.area?.name}</span>
                <div className="flex flex-row gap-2 items-center">
                  <Star
                    onClick={() => report.toggleStarred(starredItemData)}
                    className={`ml-auto text-meepGray-400 cursor-pointer ${
                      report.isStarred(starredItemData)
                        ? 'fill-meepGray-400 hover:text-meepGray-200 hover:fill-meepGray-600'
                        : 'fill-transparent hover:text-white hover:fill-white'
                    }`}
                    size={16}
                  />
                  <LucideLink
                    onClick={copyAreaURL}
                    className="ml-auto text-meepGray-400 hover:text-meepGray-200 cursor-pointer"
                    size={16}
                  />
                  <TargetIcon
                    className="ml-auto text-meepGray-400 hover:text-meepGray-200 cursor-pointer"
                    size={16}
                    onClick={explorer.zoom}
                  />
                </div>
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
        <TabsContent value="summary" className="pb-24">
          <div className="divide-y divide-meepGray-800 border-b border-meepGray-800">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToParentElement]}
              onDragEnd={({ active, over }) => {
                if (!!over && active.id !== over.id) {
                  report.updateReport((draft) => {
                    const oldIndex =
                      draft.displayOptions.areaExplorer.displaySortOrder.indexOf(
                        String(active.id)
                      )
                    const newIndex =
                      draft.displayOptions.areaExplorer.displaySortOrder.indexOf(
                        String(over.id)
                      )
                    draft.displayOptions.areaExplorer.displaySortOrder =
                      arrayMove(
                        draft.displayOptions.areaExplorer.displaySortOrder,
                        oldIndex,
                        newIndex
                      )
                  })
                }
              }}
            >
              <SortableContext
                items={
                  report.report.displayOptions.areaExplorer.displaySortOrder
                }
                strategy={verticalListSortingStrategy}
              >
                {report.report.displayOptions.areaExplorer.displaySortOrder
                  .map(
                    (displayId) =>
                      report.report.displayOptions.areaExplorer.displays[
                        displayId
                      ]
                  )
                  .filter(Boolean)
                  .map((display) => (
                    <SortableAreaDisplay
                      key={display.id}
                      display={display}
                      gss={gss}
                      areaName={areaData.data?.area?.name}
                    />
                  ))}
              </SortableContext>
            </DndContext>
          </div>
          {/* Button opens prompt, select layer, creates display: */}
          <DisplayCreator />
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
      query: {
        id: gss,
        entity: 'area',
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

const AREA_EXPLORER_SUMMARY = gql`
  query AreaExplorerSummary($gss: String!) {
    area(gss: $gss) {
      id
      fitBounds
      name
      areaType {
        name
        description
        code
      }
      samplePostcode {
        parliamentaryConstituency2024
        adminWard
        adminDistrict
        europeanElectoralRegion
        codes {
          adminWard
          adminDistrict
          parliamentaryConstituency2024
        }
      }
    }
  }
`

function SortableAreaDisplay({
  display,
  gss,
  areaName,
}: {
  display: IExplorerDisplay
  gss: string
  areaName?: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: display.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      className="py-1 px-4 bg-meepGray-600"
      style={style}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <AreaDisplay display={display} gss={gss} areaName={areaName || ''} />
    </div>
  )
}

function AreaDisplay({
  display,
  gss,
  areaName,
}: {
  display: IExplorerDisplay
  gss: string
  areaName: string
}) {
  const explorer = useExplorer()
  const report = useReport()
  const layer = report.report.layers.find((l) => l.id === display.layerId)
  const sourceId = layer?.source

  const data = useQuery<AreaLayerDataQuery, AreaLayerDataQueryVariables>(
    AREA_LAYER_DATA,
    {
      variables: {
        gss,
        externalDataSource: sourceId!,
        mode: display.areaQueryMode,
      },
      skip: !sourceId || !gss,
    }
  )

  const { updateReport } = useReport()

  if (!layer) {
    return
  }

  return (
    <CollapsibleSection
      title={display.name || layer.name}
      titleProps={contentEditableMutation((d) => {
        updateReport((draft) => {
          draft.displayOptions.areaExplorer.displays[display.id].name = d
        })
      })}
      id={display.id}
      actions={
        // Dropdown with these two editor select options
        <Popover>
          <PopoverTrigger>
            <PencilIcon className="w-3 h-3 text-meepGray-200 cursor-pointer hover:text-meepGray-300" />
          </PopoverTrigger>
          <PopoverContent>
            <EditorSelect
              label={'Display style'}
              value={display.displayType || InspectorDisplayType.Table}
              options={Object.entries(InspectorDisplayType).map(
                ([key, value]) => ({
                  value: value,
                  label: toSpaceCase(value),
                })
              )}
              onChange={(value) => {
                updateReport((draft) => {
                  draft.displayOptions.areaExplorer.displays[
                    display.id
                  ].displayType = value as InspectorDisplayType
                })
              }}
            />
            <EditorSelect
              label={'Data fetching'}
              value={display.areaQueryMode}
              options={Object.entries(AreaQueryMode).map(([key, value]) => ({
                value: value,
                label: toSpaceCase(value),
              }))}
              onChange={(value) => {
                updateReport((draft) => {
                  draft.displayOptions.areaExplorer.displays[
                    display.id
                  ].areaQueryMode = value as AreaQueryMode
                })
              }}
            />
            <EditorSwitch
              label="Aggregate data"
              explainer={
                display.dataDisplayMode === DataDisplayMode.Aggregated
                  ? 'Toggle off to show full data for all found records.'
                  : 'Toggle on to show aggregated numerical data for this area.'
              }
              value={display.dataDisplayMode === DataDisplayMode.Aggregated}
              onChange={(value) =>
                updateReport((draft) => {
                  draft.displayOptions.areaExplorer.displays[
                    display.id
                  ].dataDisplayMode = value
                    ? DataDisplayMode.Aggregated
                    : DataDisplayMode.RawData
                })
              }
            />
            {display.displayType === InspectorDisplayType.BigNumber &&
              display.dataDisplayMode === DataDisplayMode.Aggregated && (
                <EditorSelect
                  label={'Displayed field'}
                  value={display.bigNumberField}
                  options={Object.keys(
                    data.data?.summary?.aggregated || {}
                  ).map((key) => ({
                    value: key,
                    label: key,
                  }))}
                  onChange={(value) => {
                    updateReport((draft) => {
                      draft.displayOptions.areaExplorer.displays[
                        display.id
                      ].bigNumberField = value
                    })
                  }}
                />
              )}
            <EditorSelect
              label={'Type of data'}
              explainer={"Change the data's type for display purposes."}
              value={display.dataSourceType || layer.sourceData.dataType}
              options={Object.entries(DataSourceType).map(([key, value]) => ({
                value: value,
                label: toSpaceCase(value),
              }))}
              onChange={(value) => {
                updateReport((draft) => {
                  draft.displayOptions.areaExplorer.displays[
                    display.id
                  ].dataSourceType = value as DataSourceType
                })
              }}
            />
            <hr className="mt-4 my-2" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                updateReport((draft) => {
                  const id = v4()
                  draft.displayOptions.areaExplorer.displays[id] =
                    explorerDisplaySchema.parse(cloneDeep(display))
                  draft.displayOptions.areaExplorer.displays[id].id = id
                })
              }}
            >
              Duplicate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => {
                updateReport((draft) => {
                  delete draft.displayOptions.areaExplorer.displays[display.id]
                })
              }}
            >
              Remove
            </Button>
          </PopoverContent>
        </Popover>
      }
    >
      {data.loading ? (
        <div className="text-meepGray-400">
          <LoadingIcon size={'32px'} />
        </div>
      ) : data.error || !data.data ? (
        <div className="text-meepGray-400 py-2">No data available</div>
      ) : (
        <div className="text-meepGray-400">
          {display.displayType === InspectorDisplayType.Properties ? (
            display.dataDisplayMode === DataDisplayMode.Aggregated ? (
              <PropertiesDisplay data={data.data?.summary?.aggregated} />
            ) : // There's a list of data
            data.data.data.length > 1 ||
              // There's only one data item, but it's not the current area
              (!!data.data.data.length &&
                !data.data.data.some(
                  (d) => d.area?.gss === explorer.state.id
                )) ? (
              <RelatedDataCarousel data={data.data.data} />
            ) : !!data.data?.data?.length ? (
              // There's only one data item, and it's the current area
              <PropertiesDisplay data={data.data?.data?.[0]?.json} />
            ) : (
              <div className="text-meepGray-400 py-2">No data available</div>
            )
          ) : display.displayType === InspectorDisplayType.Table ? (
            <TableDisplay
              data={
                display.dataDisplayMode === DataDisplayMode.Aggregated
                  ? data.data?.summary?.aggregated
                  : data.data?.data
              }
              title={display.name || layer.name}
              areaName={areaName}
            />
          ) : display.dataDisplayMode &&
            display.displayType === InspectorDisplayType.ElectionResult ? (
            <ElectionResultsDisplay
              data={data.data?.summary}
              // dataDisplayMode={DataDisplayMode.Aggregated}
              // Only ever supply aggregated data,
              // since raw JSON might have random string values
              // .
              // data={
              //   display.dataDisplayMode === DataDisplayMode.Aggregated
              //     ? data.data?.summary
              //     : data.data?.summary?.metadata.numericalKeys
              //       ? Object.fromEntries(
              //           Object.entries(data.data?.data?.[0]?.json).filter(
              //             ([key, value]) =>
              //               data.data?.summary?.metadata.numericalKeys!.includes(
              //                 key
              //               )
              //           )
              //         )
              //       : data.data?.data?.[0]?.json
              // }
              // dataDisplayMode={display.dataDisplayMode}
            />
          ) : display.displayType === InspectorDisplayType.BigNumber ? (
            <BigNumberDisplay
              count={
                display.dataDisplayMode === DataDisplayMode.Aggregated &&
                display.bigNumberField
                  ? data.data?.summary?.aggregated[display.bigNumberField] ||
                    '???'
                  : data.data?.data?.length
              }
              dataType={display.dataSourceType || layer.sourceData.dataType}
              label={
                display.dataDisplayMode === DataDisplayMode.Aggregated &&
                display.bigNumberField
                  ? display.bigNumberField
                  : undefined
              }
            />
          ) : display.displayType === InspectorDisplayType.BigRecord ? (
            <BigRecord
              item={data.data?.data?.[0]}
              dataType={display.dataSourceType || layer.sourceData.dataType}
            />
          ) : display.displayType === InspectorDisplayType.List ? (
            <ListDisplay
              data={data.data?.data}
              dataType={display.dataSourceType || layer.sourceData.dataType}
            />
          ) : (
            JSON.stringify(data.data)
          )}
        </div>
      )}
      <span className="text-meepGray-400 text-sm flex flex-row items-center gap-1 mt-2">
        Source:{' '}
        <DataSourceIcon
          crmType={layer.sourceData.crmType}
          className="w-5 h-5"
        />{' '}
        <a
          className="underline hover:text-meepGray-300"
          {...(!!layer.sourceData.remoteUrl && {
            href: layer.sourceData.remoteUrl,
            target: '_blank',
          })}
        >
          {layer.sourceData.name}
        </a>
      </span>
    </CollapsibleSection>
  )
}

const AREA_LAYER_DATA = gql`
  query AreaLayerData(
    $gss: String!
    $externalDataSource: String!
    $mode: AreaQueryMode
  ) {
    # collect point data
    data: genericDataFromSourceAboutArea(
      gss: $gss
      sourceId: $externalDataSource
      mode: $mode
    ) {
      json
      id
      startTime
      postcode
      date
      description
      name
      publicUrl
      area {
        id
        gss
        name
        areaType {
          name
        }
      }
    }
    # aggregate statistics about any data related to this area
    summary: genericDataSummaryFromSourceAboutArea(
      gss: $gss
      sourceId: $externalDataSource
      mode: $mode
    ) {
      aggregated
      metadata {
        first
        second
        third
        last
        total
        majority
        count
        mean
        median
        numericalKeys
        percentageKeys
        isPercentage
      }
    }
  }
`

function RelatedDataCarousel({ data }: { data: AreaLayerDataQuery['data'] }) {
  const explorer = useExplorer()
  const [api, setApi] = useState<CarouselApi>()
  const [currentIndex, setCurrentIndex] = useState<number>(1)
  useEffect(() => {
    api?.on('settle', (slides) => {
      const index = slides.slidesInView()[0] || 0
      setCurrentIndex(index + 1)
    })
  }, [api])

  return (
    <>
      {api && (
        <div className="flex flex-row gap-2 items-center justify-start text-sm mb-2">
          <ArrowLeft
            onClick={() => api.scrollPrev()}
            className="w-4 h-4 cursor-pointer text-meepGray-400 hover:text-meepGray-300"
          />
          <ArrowRight
            onClick={() => api.scrollNext()}
            className="w-4 h-4 cursor-pointer text-meepGray-400 hover:text-meepGray-300"
          />
          <span className="pointer-events-none select-none">
            Record <span>{currentIndex}</span> of {data.length}
          </span>
        </div>
      )}
      <Carousel setApi={setApi} className="">
        <CarouselContent className="-ml-2">
          {data.map((item) => (
            <CarouselItem key={item.id} className="pl-2 basis-full">
              {
                // Isn't the current area
                item.area?.gss !== explorer.state.id && (
                  // Place name + link
                  <div className="text-sm mb-2">
                    Record for{' '}
                    <span
                      className="text-meepGray-400 hover:text-meepGray-300 cursor-pointer underline"
                      onClick={() => {
                        explorer.select(
                          {
                            entity: 'area',
                            id: item.area?.gss || '',
                            showExplorer: true,
                          },
                          {
                            bringIntoView: true,
                          }
                        )
                      }}
                    >
                      {item.area?.name} (
                      {pluralize(item.area?.areaType.name || 'area', 1)})
                    </span>
                  </div>
                )
              }
              <PropertiesDisplay data={item.json} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </>
  )
}

function ElectionResultsDisplay({
  data,
  // dataDisplayMode,
}: {
  data: AreaLayerDataQuery['summary']
  // | {
  //     data?: AreaLayerDataQuery['summary']
  //     dataDisplayMode: DataDisplayMode.Aggregated
  //   }
  // | {
  //     dataDisplayMode: DataDisplayMode.RawData
  //     data: AreaLayerDataQuery['data']
  //   }
}) {
  if (!data || !data.aggregated || !data.metadata) {
    return <div className="text-meepGray-400 py-2">No data available</div>
  }

  const { total, majority, isPercentage } = data.metadata

  // let metadata: {
  //   total?: number
  //   majority?: number
  // }
  // if (dataDisplayMode === DataDisplayMode.Aggregated) {
  // const orderedNumericValues = Object.values(data.aggregated)
  //   .map(Number)
  //   .filter(Number.isFinite)
  //   .sort((a, b) => b - a)
  // const first = data.metadata.first || orderedNumericValues[0]
  // const second = data.metadata.second || orderedNumericValues[1]
  // metadata = {
  //   total: data.metadata.total || sum(orderedNumericValues) || undefined,
  //   majority: !!first && !!second ? first - second : undefined,
  // }
  // } else {
  //   const orderedNumericValues = Object.values(data)
  //     .map(Number)
  //     .filter(Number.isFinite)
  //     .sort((a, b) => b - a)
  //   const first = orderedNumericValues[0]
  //   const second = orderedNumericValues[1]
  //   metadata = {
  //     total: sum(orderedNumericValues) || undefined,
  //     majority: !!first && !!second ? first - second : undefined,
  //   }
  // }

  // const { total, majority } = metadata

  const numberFormat = isPercentage ? format('.1%') : format(',.0f')

  if (!isPercentage && !total) {
    return (
      <div className="text-meepGray-400 py-2">No numerical data available</div>
    )
  }

  return (
    <div>
      {(!!majority || !!total) && (
        <div className="grid grid-cols-2 gap-4 my-4">
          {/* Total votes */}
          {!!majority && (
            <div className="flex flex-col gap-1">
              <div className="text-xs uppercase text-meepGray-400">
                Majority
              </div>
              <div className="text-2xl text-white">
                {numberFormat(majority)}
              </div>
            </div>
          )}
          {!!total && (
            <div className="flex flex-col gap-1">
              <div className="text-xs uppercase text-meepGray-400">
                Total votes
              </div>
              <div className="text-2xl text-white">{numberFormat(total)}</div>
            </div>
          )}
        </div>
      )}
      <div>
        {Object.entries(data.aggregated || {})
          .filter(([_, n]) => Number(n) && Number.isFinite(n))
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([key, votes]) => {
            const guessedParty = guessParty(key)
            return (
              <div key={key} className="flex flex-col gap-2 my-2">
                {/* Bar with relative progress */}
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex flex-row justify-between items-center text-xs">
                    <div className="text-white">{guessedParty.name}</div>
                    <div className="flex flex-row gap-2 items-center">
                      {!isPercentage ? (
                        <>
                          <span>
                            {numberFormat(votes as number)}{' '}
                            {pluralize('vote', votes as number)}
                          </span>
                          <span className="text-white">
                            {format('.0%')((votes as number) / total!)}
                          </span>
                        </>
                      ) : (
                        <span className="text-white">
                          {numberFormat(votes as number)}{' '}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 items-center">
                    <div
                      className="h-[15px] rounded"
                      style={{
                        width: isPercentage
                          ? format('.0%')(votes as number)
                          : format('.0%')((votes as number) / total!),
                        backgroundColor: guessedParty.colour,
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

function guessParty(searchStr: string) {
  // trigramSimilarity each party name to the keys in the map
  // return the colour of the most similar party
  const similarities = partyDictionary
    .map((party) => ({
      party: party,
      // @ts-ignore
      similarity:
        party.name === searchStr || party.aliases.some((a) => a === searchStr)
          ? 1
          : trigramSimilarity(party.name, searchStr),
    }))
    .sort((a, b) => b.similarity - a.similarity)

  return similarities[0].party || partyOther
}

const partyOther = {
  name: 'Other',
  colour: 'gray',
  aliases: ['Other', 'Oth'],
}

const partyDictionary: {
  name: string
  colour: string
  aliases: string[]
}[] = [
  {
    name: 'Conservative',
    colour: '#0087DC',
    aliases: ['Conservative', 'Con'],
  },
  {
    name: 'Labour',
    colour: '#DC241f',
    aliases: ['Labour', 'Lab'],
  },
  {
    name: 'Liberal Democrats',
    colour: '#FAA61A',
    aliases: ['LD', 'LDEM', 'LibDem'],
  },
  {
    name: 'SNP',
    colour: '#FFF95D',
    aliases: ['SNP'],
  },
  {
    name: 'Green',
    colour: '#6AB023',
    aliases: ['Green', 'Grn'],
  },
  {
    name: 'Plaid Cymru',
    colour: '#008142',
    aliases: ['Plaid Cymru', 'PC'],
  },
  {
    name: 'UKIP',
    colour: '#70147A',
    aliases: ['UKIP'],
  },
  {
    name: 'Brexit',
    colour: '#12B6CF',
    aliases: ['Brexit'],
  },
  {
    name: 'Independent',
    colour: 'gray',
    aliases: ['Independent', 'Ind'],
  },
  {
    name: 'Reform',
    colour: '#12B6CF',
    aliases: ['Reform', 'Ref'],
  },
  partyOther,
]

const partyColourMap = {
  Conservative: '#0087DC',
  Con: '#0087DC',
  Labour: '#DC241f',
  Lab: '#DC241f',
  LibDem: '#FAA61A',
  LDem: '#FAA61A',
  SNP: '#FFF95D',
  Green: '#6AB023',
  Grn: '#6AB023',
  'Plaid Cymru': '#008142',
  PC: '#008142',
  UKIP: '#70147A',
  Brexit: '#12B6CF',
  Independent: 'gray',
  Ind: 'gray',
  Reform: '#12B6CF',
  Ref: '#12B6CF',
  Other: 'gray',
  Oth: 'gray',
}

function BigNumberDisplay({
  count = 0,
  dataType,
  label,
}: {
  count: number
  dataType?: DataSourceType
  label?: string
}) {
  return (
    <div className="py-2">
      {!!(dataType || label) && (
        <div className="uppercase text-xs text-meepGray-400">
          {label
            ? label
            : dataType
              ? pluralize(toSpaceCase(dataType) || 'record', 2)
              : null}
        </div>
      )}
      <div className="text-white text-3xl">{format(',')(count)}</div>
    </div>
  )
}

function ListDisplay({
  data,
  dataType,
}: {
  data?: AreaLayerDataQuery['data']
  dataType: DataSourceType
}) {
  const explorer = useExplorer()

  if (!data || !data.length) {
    return <div className="text-meepGray-400 py-2">No data available</div>
  }

  return (
    <div className="bg-meepGray-700 rounded-md max-h-[30vh] overflow-y-auto">
      {data?.map((item: any) => {
        const { primary, secondary } = getListValuesBasedOnDataType(
          item,
          dataType
        )
        const isActive = explorer.isValidEntity(explorer.state)

        return (
          <div
            key={item.id}
            className={`text-meepGray-200 justify-start flex gap-1 font-mono text-sm hover:bg-meepGray-800 p-2 cursor-pointer border-b border-meepGray-800 ${
              isActive ? 'bg-white text-meepGray-800 hover:bg-white' : ''
            }`}
            onClick={() => {
              explorer.select(
                {
                  entity: 'record',
                  id: item.id,
                  showExplorer: true,
                },
                {
                  bringIntoView: true,
                }
              )
            }}
          >
            <DataSourceTypeIcon
              dataType={
                dataType === DataSourceType.AreaStats ? undefined : dataType
              }
              defaultIcon={MapPinIcon}
            />
            <div className="flex flex-col gap-1">{primary}</div>
            <div className="ml-auto flex flex-col gap-1 text-meepGray-400">
              {secondary}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BigRecord({
  item,
  dataType,
}: {
  item?: AreaLayerDataQuery['data'][0]
  dataType: DataSourceType
}) {
  const explorer = useExplorer()

  if (!item) {
    return <div className="text-meepGray-400 py-2">No data available</div>
  }

  const { primary, secondary } = getListValuesBasedOnDataType(item, dataType)
  const isActive = explorer.isValidEntity(explorer.state)

  return (
    <div
      className="justify-start items-center flex gap-1 cursor-pointer pt-1 pb-2"
      onClick={() => {
        explorer.select(
          {
            entity: 'record',
            id: item.id,
            showExplorer: true,
          },
          {
            bringIntoView: true,
          }
        )
      }}
    >
      <div className="inline-flex justify-center items-center w-11 h-11 bg-primary border rounded-full">
        <DataSourceTypeIcon
          dataType={
            dataType === DataSourceType.AreaStats ? undefined : dataType
          }
          defaultIcon={MapPinIcon}
          className="w-6 h-6"
        />
      </div>
      <div>
        <div className="text-white text-base flex flex-col gap-1">
          {primary}
        </div>
        {!!secondary && (
          <div className="ml-auto flex flex-col gap-1 text-meepGray-400 uppercase text-sm">
            {secondary}
          </div>
        )}
      </div>
    </div>
  )
}

function getListValuesBasedOnDataType(
  item: AreaLayerDataQuery['data'][0],
  dataType: DataSourceType
) {
  type ListValues = {
    primary: any[]
    secondary: any[]
  }

  const humanReadableDataType = toSpaceCase(dataType)
  const noun = dataType ? toSpaceCase(dataType) : 'record'
  const unnamedRecordName = `Unnamed ${toSpaceCase(noun)}`

  switch (dataType) {
    case DataSourceType.Member:
      return {
        primary: [item.name || unnamedRecordName],
        secondary: [item.postcode || humanReadableDataType],
      } satisfies ListValues
    case DataSourceType.Event: {
      return {
        primary: [item.name || unnamedRecordName],
        secondary: [
          item.startTime || item.date || item.postcode || humanReadableDataType,
        ],
      } satisfies ListValues
    }
    case DataSourceType.Group: {
      return {
        primary: [item.name || unnamedRecordName],
        secondary: [item.date || humanReadableDataType],
      } satisfies ListValues
    }
    case DataSourceType.AreaStats: {
      return {
        primary: [item.name || unnamedRecordName],
        secondary: [item.date || humanReadableDataType],
      } satisfies ListValues
    }
    case DataSourceType.Location: {
      return {
        primary: [item.name || unnamedRecordName],
        secondary: [item.date || humanReadableDataType],
      } satisfies ListValues
    }
    case DataSourceType.Other: {
      return {
        primary: [item.name || unnamedRecordName],
        secondary: [item.date || humanReadableDataType],
      } satisfies ListValues
    }
    case DataSourceType.Story: {
      return {
        primary: [item.name || unnamedRecordName],
        secondary: [item.date || humanReadableDataType],
      } satisfies ListValues
    }
  }
}

function AreaExplorerBreadcrumbs({
  area,
}: {
  area: AreaExplorerSummaryQuery['area']
}) {
  const explorer = useExplorer()
  const mapView = useView(ViewType.Map)

  const {
    europeanElectoralRegion,
    parliamentaryConstituency2024,
    adminDistrict,
    adminWard,
    codes,
  } = area?.samplePostcode || {}

  const selectedAreaType = area?.areaType?.name

  const ExplorerAreaBreadCrumbMapping: Record<
    string,
    ExplorerAreaBreadCrumbMapping
  > = {
    europeanElectoralRegion: {
      value: europeanElectoralRegion,
      code: undefined,
      type: BoundaryType.EUROPEAN_ELECTORAL_REGIONS,
    },
    adminDistrict: {
      value: adminDistrict,
      code: codes?.adminDistrict,
      type: BoundaryType.LOCAL_AUTHORITIES,
    },
    parliamentaryConstituency2024: {
      value: parliamentaryConstituency2024,
      code: codes?.parliamentaryConstituency2024,
      type: BoundaryType.PARLIAMENTARY_CONSTITUENCIES,
    },
  }

  // Define breadcrumb hierarchies for different area types
  const breadcrumbConfigs = {
    'Single Tier Councils': [
      ExplorerAreaBreadCrumbMapping.europeanElectoralRegion,
    ],
    '2023 Parliamentary Constituency': [
      ExplorerAreaBreadCrumbMapping.europeanElectoralRegion,
      ExplorerAreaBreadCrumbMapping.adminDistrict,
    ],
    Wards: [
      ExplorerAreaBreadCrumbMapping.europeanElectoralRegion,
      ExplorerAreaBreadCrumbMapping.adminDistrict,
      ExplorerAreaBreadCrumbMapping.parliamentaryConstituency2024,
    ],
  }

  const activeBreadcrumbs =
    breadcrumbConfigs[selectedAreaType as keyof typeof breadcrumbConfigs] || []

  function handleBreadcrumbClick(crumb: {
    value: any
    code: string
    type: BoundaryType
  }) {
    explorer.select(
      {
        id: crumb.code,
        entity: 'area',
        showExplorer: true,
      },
      {
        bringIntoView: true,
      }
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex gap-2 text-meepGray-400 overflow-x-auto whitespace-nowrap max-w-[320px] no-scrollbar">
        <div className="flex gap-2 items-center">
          {activeBreadcrumbs.map((crumb, index) => (
            <Fragment key={index}>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="max-w-28 truncate cursor-pointer"
                  onClick={() =>
                    handleBreadcrumbClick({
                      value: crumb.value,
                      code: crumb.code || '',
                      type: crumb.type,
                    })
                  }
                >
                  {crumb.value}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </Fragment>
          ))}
          <div className="text-xs labels-condensed text-meepGray-200 uppercase">
            {selectedAreaType ? pluralize(selectedAreaType, 1) : 'Area'}
          </div>
        </div>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
