import {
  AreaDisplayStatisticsQuery,
  AreaDisplayStatisticsQueryVariables,
  AreaExplorerSummaryQuery,
  AreaExplorerSummaryQueryVariables,
  AreaLayerDataQuery,
  AreaLayerDataQueryVariables,
  AreaQueryMode,
  DataSourceType,
} from '@/__generated__/graphql'
import { StatisticsConfigSchema } from '@/__generated__/zodSchema'
import { DataSourceIcon } from '@/components/DataSourceIcon'
import { DataSourceTypeIcon } from '@/components/icons/DataSourceType'
import { PopOutStatisticalQueryEditor } from '@/components/report/PopOutStatisticalQueryEditor'
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
import { ExplorerState, useExplorer } from '@/lib/map/useExplorer'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import { allKeysFromAllData } from '@/lib/utils'
import { gql, useQuery } from '@apollo/client'
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { contrastColor } from 'contrast-color'
import { format } from 'd3-format'
import { produce } from 'immer'
import { cloneDeep, isUndefined, sum } from 'lodash'
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
import { CSSProperties, Fragment, useEffect, useState } from 'react'
import { toast } from 'sonner'
import toSpaceCase from 'to-space-case'
import trigramSimilarity from 'trigram-similarity'
import { v4 } from 'uuid'
import { BoundaryType } from '../../politicalTilesets'
import {
  DataDisplayMode,
  ElectionSystem,
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

export function AreaExplorer({ gss }: { gss?: string }) {
  const [selectedTab, setSelectedTab] = useState('summary')
  const explorer = useExplorer()
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: {
          y: 100,
        },
      },
    })
  )

  // Query area details
  const areaData = useQuery<
    AreaExplorerSummaryQuery,
    AreaExplorerSummaryQueryVariables
  >(AREA_EXPLORER_SUMMARY, {
    variables: { gss: gss! },
    skip: !gss,
  })

  const report = useReport()

  const starredItemData: StarredState = {
    id: gss || '',
    entity: 'area',
    showExplorer: true,
    name: areaData.data?.area?.name || '',
  }

  return (
    <SidebarContent className="bg-meepGray-600 overflow-x-hidden h-full">
      {!!gss || areaData.data ? (
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
      ) : (
        <SidebarHeader className="!text-white p-4 mb-0">
          <span className="text-hMd">United Kingdom</span>
        </SidebarHeader>
      )}
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
              collisionDetection={closestCorners}
              modifiers={[restrictToParentElement, restrictToVerticalAxis]}
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
                      area={areaData.data?.area}
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
    if (!gss) return
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
      analyticalAreaType
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
  area,
}: {
  display: IExplorerDisplay
  gss?: string
  area?: AreaExplorerSummaryQuery['area']
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: display.id })

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: isDragging ? 'relative' : 'inherit',
    zIndex: isDragging ? 1000 : 0,
  }

  return (
    <div
      className="py-1 px-4 bg-meepGray-600 group/display"
      style={style}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <AreaDisplay display={display} gss={gss} area={area} />
    </div>
  )
}

function AreaDisplay({
  display,
  gss,
  area,
}: {
  display: IExplorerDisplay
  gss?: string
  area: AreaExplorerSummaryQuery['area']
}) {
  const view = useView(ViewType.Map)
  const explorer = useExplorer()
  const report = useReport()
  const layer = report.report.layers.find((l) => l.id === display.layerId)
  const sourceId = layer?.source

  const relevantChoroplethConfig =
    (!!sourceId &&
      // Relates to this source
      ((
        view.currentViewOfType?.mapOptions.choropleth.advancedStatisticsConfig
          .sourceIds || []
      ).includes(sourceId)
        ? view.currentViewOfType?.mapOptions.choropleth.advancedStatisticsConfig
        : {})) ||
    {}

  console.log(sourceId, relevantChoroplethConfig)

  const data = useQuery<AreaLayerDataQuery, AreaLayerDataQueryVariables>(
    AREA_LAYER_DATA,
    {
      variables: {
        gss: gss!,
        externalDataSource: sourceId!,
        mode: display.areaQueryMode,
      },
      skip: !sourceId,
    }
  )

  // const boundaryType =
  //   view.currentViewOfType?.mapOptions.choropleth?.boundaryType
  // const tilesets = POLITICAL_BOUNDARIES.find(
  //   (boundary) => boundary.boundaryType === boundaryType
  // )?.tilesets

  // const activeTileset = useActiveTileset(boundaryType)

  const stats = useQuery<
    AreaDisplayStatisticsQuery,
    AreaDisplayStatisticsQueryVariables
  >(STATISTICS, {
    variables: {
      statsConfig: {
        groupByArea: area?.analyticalAreaType
          ? area?.analyticalAreaType
          : undefined,
        areaQueryMode: display.areaQueryMode,
        ...((display.appendChoroplethStatistics
          ? relevantChoroplethConfig
          : {}) || {}),
        ...((display.useAdvancedStatistics
          ? display.advancedStatisticsConfig
          : {}) || {}),
        sourceIds: [sourceId!],
        gssCodes: gss ? [gss] : null,
        groupAbsolutely: display.dataDisplayMode === DataDisplayMode.Aggregated,
        formatNumericKeys: display.formatNumericKeys,
      },
    },
    skip: !sourceId,
  })

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
      headerClassName={
        // hide when not configuring?
        display.hideTitle || isUndefined(display.hideTitle)
          ? `
            [[data-state="open"]_&]:opacity-0 group-hover/display:[[data-state="open"]_&]:opacity-100
            [[data-state="open"]_&]:mt-1 group-hover/display:[[data-state="open"]_&]:mt-3
            [[data-state="open"]_&]:mb-1 group-hover/display:[[data-state="open"]_&]:mb-3
            [[data-state="open"]_&]:max-h-0 group-hover/display:[[data-state="open"]_&]:max-h-[200px]
            transition-all duration-300 ease-in-out
          `
          : undefined
      }
      id={display.id}
      actions={
        // Dropdown with these two editor select options
        <Popover>
          <PopoverTrigger>
            <PencilIcon className="w-3 h-3 text-meepGray-200 cursor-pointer hover:text-meepGray-300" />
          </PopoverTrigger>
          <PopoverContent className="space-y-3">
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
            <EditorSwitch
              // isPercentage
              label="Is this percentage data?"
              explainer={
                display.isPercentage
                  ? 'Toggle off to show raw numerical data.'
                  : 'Toggle on to show percentage data.'
              }
              value={display.isPercentage}
              onChange={(value) =>
                updateReport((draft) => {
                  draft.displayOptions.areaExplorer.displays[
                    display.id
                  ].isPercentage = value
                })
              }
            />
            <EditorSwitch
              label="Format numeric values"
              value={display.formatNumericKeys}
              onChange={(value) => {
                updateReport((draft) => {
                  draft.displayOptions.areaExplorer.displays[
                    display.id
                  ].formatNumericKeys = value
                })
              }}
            />
            {display.displayType === InspectorDisplayType.BigNumber &&
              display.dataDisplayMode === DataDisplayMode.Aggregated && (
                <EditorSelect
                  label={'Displayed field'}
                  value={display.bigNumberField}
                  options={allKeysFromAllData(stats.data?.statistics || {}).map(
                    (key) => ({
                      value: key,
                      label: key,
                    })
                  )}
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
            {display.displayType === InspectorDisplayType.ElectionResult ||
            display.displayType === InspectorDisplayType.StatisticalCount ? (
              <>
                <EditorSwitch
                  label="Is this electoral data?"
                  value={!!display.isElectoral}
                  onChange={(value) => {
                    updateReport((draft) => {
                      draft.displayOptions.areaExplorer.displays[
                        display.id
                      ].isElectoral = value
                    })
                  }}
                />
                <EditorSelect
                  label="Election system"
                  value={display.electionSystem || ElectionSystem.FPTP}
                  options={Object.entries(ElectionSystem).map(
                    ([key, value]) => ({
                      value: value,
                      label: toSpaceCase(value),
                    })
                  )}
                  onChange={(value) => {
                    updateReport((draft) => {
                      draft.displayOptions.areaExplorer.displays[
                        display.id
                      ].electionSystem = value as ElectionSystem
                    })
                  }}
                />
              </>
            ) : null}
            <EditorSwitch
              label="Use advanced statistics API"
              value={display.useAdvancedStatistics}
              onChange={(value) => {
                updateReport((draft) => {
                  draft.displayOptions.areaExplorer.displays[
                    display.id
                  ].useAdvancedStatistics = value
                })
              }}
            />

            <EditorSwitch
              label="Include choropleth statistics settings"
              value={display.appendChoroplethStatistics}
              onChange={(value) => {
                updateReport((draft) => {
                  draft.displayOptions.areaExplorer.displays[
                    display.id
                  ].appendChoroplethStatistics = value
                })
              }}
            />

            {display.useAdvancedStatistics && !!sourceId && (
              <PopOutStatisticalQueryEditor
                value={
                  display.advancedStatisticsConfig ||
                  StatisticsConfigSchema().parse({
                    sourceIds: [sourceId],
                  })
                }
                onChange={(producer) => {
                  updateReport((draft) => {
                    const oldValue =
                      draft.displayOptions.areaExplorer.displays[display.id]
                        .advancedStatisticsConfig ||
                      StatisticsConfigSchema().parse({
                        sourceIds: [sourceId],
                      })
                    draft.displayOptions.areaExplorer.displays[
                      display.id
                    ].advancedStatisticsConfig = produce(oldValue, producer)
                  })
                }}
              />
            )}
            <EditorSwitch
              label="Hide title"
              value={display.hideTitle || isUndefined(display.hideTitle)}
              onChange={(value) => {
                updateReport((draft) => {
                  draft.displayOptions.areaExplorer.displays[
                    display.id
                  ].hideTitle = value
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
      {data.loading || stats.loading ? (
        <div className="text-meepGray-400">
          <LoadingIcon size={'32px'} />
        </div>
      ) : (data.error || !data.data) && (stats.error || !stats.data) ? (
        <div className="text-meepGray-400 py-2">No data available</div>
      ) : (
        <div className="text-meepGray-400">
          {display.displayType === InspectorDisplayType.Properties ? (
            display.dataDisplayMode === DataDisplayMode.Aggregated ? (
              <PropertiesDisplay data={stats.data?.statistics?.[0]} />
            ) : // There's a list of data
            (!!data.data?.data?.length && data.data?.data?.length > 1) ||
              // There's only one data item, but it's not the current area
              (!!data.data?.data.length &&
                !data.data?.data.some(
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
                  ? stats.data?.statistics?.[0]
                  : data.data?.data
              }
              title={display.name || layer.name}
              context={area?.name}
            />
          ) : display.dataDisplayMode &&
            display.displayType === InspectorDisplayType.ElectionResult ? (
            <>
              {/* If the data isn't about the current area, note this. */}
              {!!data.data?.data.length &&
                !data.data?.data.some((d) => d.area?.gss === gss) && (
                  <div className="text-sm mb-2">
                    Summarised data for{' '}
                    {data.data.data.length > 3
                      ? pluralize(
                          Array.from(
                            new Set(
                              data.data.data.map((d) =>
                                d.area?.areaType.name
                                  .replace(/[0-9]+/, '')
                                  .toLocaleLowerCase()
                              )
                            )
                          ).join(', '),
                          data.data.data.length,
                          true
                        )
                      : data.data.data.map((item) => (
                          <span
                            key={item.id}
                            className="text-meepGray-400 hover:text-meepGray-300 cursor-pointer underline mr-1"
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
                        ))}
                  </div>
                )}
              {!area && explorer.isValidEntity(explorer.state) ? (
                <LoadingIcon size={'32px'} />
              ) : (
                <ElectionResultsDisplay
                  display={display}
                  data={stats.data?.statistics?.[0]}
                />
              )}
            </>
          ) : display.displayType === InspectorDisplayType.BigNumber ? (
            <BigNumberDisplay
              count={
                display.dataDisplayMode === DataDisplayMode.Aggregated &&
                display.bigNumberField
                  ? stats.data?.statistics?.[0]?.[display.bigNumberField] ||
                    '???'
                  : format(',')(data.data?.data?.length || 0)
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
          ) : display.displayType === InspectorDisplayType.StatisticalCount ? (
            <StatisticalCount
              data={stats.data?.statistics || []}
              display={display}
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
  }
`

export const STATISTICS = gql`
  query AreaDisplayStatistics($statsConfig: StatisticsConfig!) {
    statistics(statsConfig: $statsConfig, returnNumericKeysOnly: true)
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

// const ELECTION_RESULTS = gql`
//   query AreaDisplayElectionResults(
//     $gss: String!
//     $externalDataSource: String!
//     $mode: AreaQueryMode
//     $analyticalAreaType: AnalyticalAreaType
//   ) {
//     statistics(
//       statsConfig: {
//         sourceIds: [$externalDataSource]
//         gssCodes: [$gss]
//         areaQueryMode: $mode
//         groupByArea: $analyticalAreaType
//       }
//       returnNumericKeysOnly: true
//     )
//   }
// `

function ElectionResultsDisplay({
  display,
  data,
}: {
  display: IExplorerDisplay
  data?: any
}) {
  if (!data || !Object.keys(data).length) {
    return <div className="text-meepGray-400 py-2">No data available</div>
  }

  const isPercentage = display.isPercentage

  const percentFormat = format('.1%')
  const floatFormat = format(',.0f')
  const numberFormat = isPercentage ? percentFormat : floatFormat

  const numericValues = Object.values(data).filter(Number).map(Number)
  const total = sum(numericValues)
  const sorted = numericValues.sort((a, b) => b - a)
  const [first, second, ...rest] = sorted
  const majority = first - second

  const firstPartyKey =
    display.electionSystem === ElectionSystem.Majority
      ? // Find which party has > 0.5 of total
        Object.keys(data).find((key) => data[key] >= total / 2)
      : Object.keys(data).find((key) => data[key] === first)
  const firstParty = firstPartyKey ? guessParty(firstPartyKey) : undefined

  return (
    <div>
      {(!!majority || !!total) && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {!!firstParty ? (
            <div className="col-span-2 flex flex-row gap-1 items-center text-white">
              <span
                className="px-2 py1 rounded-sm font-medium text-meepGray-950 capitalize"
                style={{
                  backgroundColor: firstParty.colour,
                  color: contrastColor({
                    bgColor: firstParty.colour,
                    defaultColor: 'white',
                  }),
                }}
              >
                {firstParty.name}
              </span>{' '}
              victory
            </div>
          ) : (
            <div className="col-span-2 flex flex-row gap-1 items-center text-white">
              No clear winner
            </div>
          )}
          {/* Total votes */}
          {!!majority && (
            <div className="flex flex-col gap-1">
              <div className="text-xs uppercase text-meepGray-400">
                Majority
              </div>
              <div className="text-2xl text-white">
                {numberFormat(majority)}
                {!!total && !isPercentage && (
                  <span className="text-meepGray-400 text-base ml-1">
                    {percentFormat(majority / total)}
                  </span>
                )}
              </div>
            </div>
          )}
          {!!total && !isPercentage && (
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
        {Object.entries(data || {})
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
                            {percentFormat((votes as number) / total!)}
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
                          ? percentFormat(votes as number)
                          : percentFormat((votes as number) / total!),
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

export function guessParty(searchStr: string) {
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

interface PartyPayload {
  name: string
  shortName: string
  colour: string
  aliases: string[]
}

const partyOther: PartyPayload = {
  name: 'Other',
  shortName: 'Other',
  colour: 'gray',
  aliases: ['Other', 'Oth'],
}

const partyDictionary: PartyPayload[] = [
  {
    name: 'Conservative',
    shortName: 'Con',
    colour: '#0087DC',
    aliases: ['Conservative', 'Con'],
  },
  {
    name: 'Labour',
    shortName: 'Lab',
    colour: '#DC241f',
    aliases: ['Labour', 'Lab'],
  },
  {
    name: 'Liberal Democrats',
    shortName: 'LD',
    colour: '#FAA61A',
    aliases: ['LD', 'LDEM', 'LibDem'],
  },
  {
    name: 'SNP',
    shortName: 'SNP',
    colour: '#FFF95D',
    aliases: ['SNP'],
  },
  {
    name: 'Green',
    shortName: 'Grn',
    colour: '#6AB023',
    aliases: ['Green', 'Grn'],
  },
  {
    name: 'Plaid Cymru',
    shortName: 'PC',
    colour: '#008142',
    aliases: ['Plaid Cymru', 'PC'],
  },
  {
    name: 'UKIP',
    shortName: 'UKIP',
    colour: '#70147A',
    aliases: ['UKIP'],
  },
  {
    name: 'Brexit',
    shortName: 'Brx',
    colour: '#12B6CF',
    aliases: ['Brexit'],
  },
  {
    name: 'Independent',
    shortName: 'Ind',
    colour: 'gray',
    aliases: ['Independent', 'Ind'],
  },
  {
    name: 'Reform',
    shortName: 'Ref',
    colour: '#6d3177', //'#12B6CF',
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
  count: any
  dataType?: DataSourceType
  label?: string
}) {
  return (
    <div className="py-2">
      {!!(dataType || label) && (
        <div className="uppercase text-xs text-meepGray-300">
          {label ? (
            label
          ) : dataType ? (
            <span>{pluralize(`${toSpaceCase(dataType)}`, 1)} records</span>
          ) : null}
        </div>
      )}
      <div className="text-white text-3xl">{count}</div>
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
        const isActive =
          explorer.isValidEntity(explorer.state) &&
          explorer.state.id === item.id

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
  // const isActive = explorer.isValidEntity(explorer.state)

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

function StatisticalCount({
  data,
  display,
}: {
  data: any[]
  display: IExplorerDisplay
}) {
  if (!data || !data.length) {
    return <div className="text-meepGray-400 py-2">No data available</div>
  }
  const grouping = display.advancedStatisticsConfig?.groupByColumns?.[0]
  if (!grouping)
    return (
      <div className="text-meepGray-400 py-2">No grouped data available</div>
    )
  const column = grouping.column
  const groupKey = grouping.name
  const valueKey = Object.keys(data[0]).find((key) =>
    key.startsWith(`${groupKey}_`)
  )

  if (!groupKey || !valueKey)
    return (
      <div className="text-meepGray-400 py-2">No grouped data available</div>
    )

  return (
    <div>
      <div className="uppercase text-xs text-meepGray-400">
        Grouped by{' '}
        {display.advancedStatisticsConfig?.groupByArea
          ? toSpaceCase(display.advancedStatisticsConfig?.groupByArea)
          : ''}{' '}
        {toSpaceCase(column)} and {grouping.aggregationOperation}
      </div>
      <main className="py-2 grid grid-cols-3 gap-4">
        {data
          .slice()
          .sort((a, b) =>
            String(b[valueKey] || 0).localeCompare(
              String(a[valueKey] || 0),
              undefined,
              {
                numeric: true,
                sensitivity: 'base',
              }
            )
          )
          .map((item: any) => {
            // TODO: make this a real key
            const reactKey = JSON.stringify(item)
            if (display.isElectoral) {
              const key = item[groupKey]
              const party = guessParty(key) || {
                name: key,
                colour: 'gray',
              }
              return (
                <article key={reactKey}>
                  <div className="text-white text-3xl">{item[valueKey]}</div>
                  <div
                    className="px-2 py1 rounded-sm font-medium text-sm text-meepGray-950 capitalize inline-block"
                    style={{
                      backgroundColor: party.colour,
                      color: contrastColor({
                        bgColor: party.colour,
                        defaultColor: 'white',
                      }),
                    }}
                  >
                    {party.shortName}
                  </div>
                </article>
              )
            } else {
              return (
                <article key={reactKey}>
                  <div className="text-white text-3xl">{item[valueKey]}</div>
                  <div className="text-meepGray-400 text-sm">
                    {item[groupKey]}
                  </div>
                </article>
              )
            }
          })}
      </main>
    </div>
  )
}
