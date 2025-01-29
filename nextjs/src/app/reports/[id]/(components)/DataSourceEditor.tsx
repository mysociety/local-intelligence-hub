import importData from '@/app/(logged-in)/data-sources/inspect/[externalDataSourceId]/importData'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { SidebarHeader } from '@/components/ui/sidebar'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { contentEditableMutation } from '@/lib/html'
import { layerEditorStateAtom, useMapZoom } from '@/lib/map'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import { useApolloClient } from '@apollo/client'
import { useDebounce } from '@uidotdev/usehooks'
import { useAtom } from 'jotai'
import { ArrowRight, LucideX, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { v4 } from 'uuid'
import { IMapLayer, ViewType, mapLayerSchema } from '../reportContext'
import { EditorColourPicker } from './EditorColourPicker'
import { EditorField } from './EditorField'
import { DEFAULT_MARKER_COLOUR } from './MembersListPointMarkers'

export function DataSourceEditor() {
  const { report } = useReport()
  const [selectedTab, setSelectedTab] = useState('style')
  const [layerEditorState, setLayerEditorState] = useAtom(layerEditorStateAtom)
  const layer = layerEditorState.open
    ? report.layers?.find((l) => l?.id === layerEditorState.layerId)
    : null

  if (!layer?.id) return null

  return (
    <>
      <SidebarHeader className="px-4 pt-4 font-semibold text-white text-sm flex flex-row gap-2 w-full mb-0">
        <div>{layer.name}</div>
        <LucideX
          size={16}
          className="ml-auto flex-shrink-0 cursor-pointer hover:text-meepGray-200 text-meepGray-400"
          onClick={() => {
            setLayerEditorState({ open: false })
          }}
        />
      </SidebarHeader>
      <Tabs
        defaultValue="style"
        className="w-full"
        onValueChange={setSelectedTab}
      >
        <TabsList
          className="w-full justify-start text-white rounded-none px-4
          border border-b-meepGray-600 pb-0 h-fit flex gap-4 bg-meepGray-800"
        >
          <TabsTrigger value="style" className={classes.tabsTrigger}>
            Style
          </TabsTrigger>
          <TabsTrigger value="data" className={classes.tabsTrigger}>
            Data
          </TabsTrigger>
        </TabsList>
        <TabsContent value="style">
          <StyleTab layerId={layer.id} />
        </TabsContent>
        <TabsContent value="data">
          <DataTab layerId={layer.id} />
        </TabsContent>
      </Tabs>
    </>
  )
}

function StyleTab({ layerId }: { layerId: string }) {
  const report = useReport()
  const reportLayer = report.getLayer(layerId)
  const view = useView(ViewType.Map)
  const viewLayersForReportLayer = Object.values(
    view.currentViewOfType?.mapOptions.layers || {}
  ).filter((layer) => layer.layerId === layerId)

  return (
    <>
      <header className="px-4 mt-4">
        <h4 className="font-semibold text-white text-sm">Map markers</h4>
        <p className="text-meepGray-400 text-sm pt-2">
          Choose how data should display on the map.
        </p>
      </header>
      {/* Point config */}
      <div className="divide-y divide-meepGray-600 border-y border-meepGray-600 mt-4">
        {viewLayersForReportLayer.map((viewLayer) => (
          <div key={viewLayer.id} className="pt-4 pb-6">
            <MapMarkerLayerEditor viewLayer={viewLayer} />
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-meepGray-400 my-2"
        onClick={() => {
          view.updateView((draft) => {
            const id = v4()
            draft.mapOptions.layers[id] = mapLayerSchema.parse({
              id,
              layerId,
              name: reportLayer?.name,
            })
          })
        }}
      >
        <Plus className="w-4" />
        add new map marker layer
      </Button>
    </>
  )
}

function MapMarkerLayerEditor({ viewLayer }: { viewLayer: IMapLayer }) {
  const view = useView(ViewType.Map)

  // Size
  const [size, setSize] = useState(viewLayer.circleRadius || 5)
  const debouncedSize = useDebounce(size, 500)
  useEffect(() => {
    view.updateView((draft) => {
      draft.mapOptions.layers[viewLayer.id].circleRadius = debouncedSize
    })
  }, [debouncedSize])

  // Zoom
  const [zoom, setZoom] = useState(viewLayer.circleRadius || 5)
  const debouncedZoom = useDebounce(zoom, 500)
  useEffect(() => {
    view.updateView((draft) => {
      draft.mapOptions.layers[viewLayer.id].minZoom = debouncedZoom
    })
  }, [debouncedZoom])

  const [currentZoom, _] = useMapZoom()
  const zoomPercent = (Number(currentZoom || 1) / 24) * 100

  return (
    <section className="px-4">
      <header className="text-white flex flex-row items-center justify-between">
        <h4
          {...contentEditableMutation((value) => {
            view.updateView((draft) => {
              draft.mapOptions.layers[viewLayer.id].name = value
            })
          })}
        >
          {viewLayer.name || `Marker layer ${viewLayer.id.substring(0, 4)}`}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => {
            view.updateView((draft) => {
              delete draft.mapOptions.layers[viewLayer.id]
            })
          }}
        >
          Remove
        </Button>
      </header>
      <div className="space-y-4">
        <EditorColourPicker
          label="Marker colour"
          value={viewLayer.colour || DEFAULT_MARKER_COLOUR}
          onChange={(value) => {
            view.updateView((draft) => {
              draft.mapOptions.layers[viewLayer.id].colour = value
            })
          }}
        />
        <EditorField label="Marker size" labelClassName="w-1/2">
          <div className="w-1/2">
            <Slider
              className="w-full"
              min={1}
              max={30}
              step={1}
              value={[size]}
              onValueChange={(value) => {
                setSize(value[0])
              }}
            />
            <div className="flex flex-row justify-between gap-1 uppercase text-xs text-meepGray-500">
              <div>Smaller</div>
              <div>Bigger</div>
            </div>
          </div>
        </EditorField>
        <EditorField
          label="Minimum zoom level"
          explainer={'Minimum zoom to display these markers'}
          labelClassName="w-1/2"
        >
          <div className="w-1/2">
            <Slider
              className="w-full"
              min={1}
              max={24}
              step={1}
              value={[zoom]}
              onValueChange={(value) => {
                setZoom(value[0])
              }}
            />
            <div className="flex flex-row justify-between gap-1 uppercase text-xs text-meepGray-500 relative w-full">
              <div>Far</div>
              <div>Close</div>
              {/* </div>
            <div className="flex flex-row justify-between gap-1 uppercase text-xs text-meepGray-500 relative w-full"> */}
              {currentZoom !== null && (
                <div
                  className="absolute top-3"
                  style={{
                    left: `${zoomPercent}%`,
                    // transform: `translateX(${zoomPercent}%)`,
                    color: 'white',
                    fontSize: '0.4rem',
                    // backgroundColor: 'rgba(0,0,0,0.5)',
                    // padding: '2px 4px',
                    // borderRadius: '2px',
                  }}
                >
                  {/* CSS triangle trick on a div */}
                  <div
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-2 border-white border-t-transparent border-l-transparent"
                    style={{ transform: 'rotate(225deg)' }}
                  />
                </div>
              )}
            </div>
          </div>
        </EditorField>
      </div>
    </section>
  )
}

function DataTab({ layerId }: { layerId: string }) {
  const client = useApolloClient()
  const { report, removeLayer } = useReport()
  const layer = report.layers?.find((l) => l?.id === layerId)!

  return (
    <div className="px-4 text-white">
      {!!layer?.sourceData &&
        (!layer.sharingPermission ? (
          <>
            <div>
              {layer.sourceData.importedDataCount || 0} records imported
            </div>
            <Link
              href={`/data-sources/inspect/${layer?.sourceData?.id}`}
              className="underline py-2 text-sm"
            >
              Inspect data source <ArrowRight />
            </Link>
            <Button
              disabled={layer.sourceData.isImportScheduled}
              onClick={() => importData(client, layer.sourceData!.id)}
            >
              {!layer.sourceData.isImportScheduled ? (
                'Import data'
              ) : (
                <span className="flex flex-row gap-2 items-center">
                  <LoadingIcon size={'18'} />
                  <span>Importing...</span>
                </span>
              )}
            </Button>
          </>
        ) : (
          <div className="text-sm">
            <div>
              This data source is managed by{' '}
              {layer.sourceData.organisation?.name}.
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex flex-row gap-1 uppercase font-semibold text-sm text-meepGray-400">
                <span>Their share settings</span>
              </div>
              <div className="flex flex-row gap-1 items-start">
                <Checkbox
                  checked={
                    !!layer.sharingPermission?.visibilityRecordCoordinates
                  }
                  disabled
                />
                <label className="-mt-1">
                  <span>Precise record locations</span>
                  <p className="text-meepGray-400 text-xs">
                    If enabled, pins will be placed on a map for each record. If
                    disabled, only aggregate ward / constituency / region data
                    will be shared.
                  </p>
                </label>
              </div>
              <div className="flex flex-row gap-1 items-start">
                <Checkbox
                  checked={!!layer.sharingPermission?.visibilityRecordDetails}
                  disabled
                />
                <label className="-mt-1">
                  <span>Record details</span>
                  <p className="text-meepGray-400 text-xs">
                    Specific data like {'"'}name{'"'}
                  </p>
                </label>
              </div>
            </div>
          </div>
        ))}
      <Button
        className="ml-1"
        onClick={() => {
          removeLayer(layer?.id)
        }}
        variant="destructive"
      >
        Remove layer
      </Button>
    </div>
  )
}

const classes = {
  tabsTrigger:
    'pb-2 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b border-white rounded-none',
}
