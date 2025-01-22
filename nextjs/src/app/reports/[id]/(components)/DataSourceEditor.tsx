import { DataSourceType } from '@/__generated__/graphql'
import importData from '@/app/(logged-in)/data-sources/inspect/[externalDataSourceId]/importData'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { SidebarHeader } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InspectorDisplayType, layerEditorStateAtom } from '@/lib/map'
import { useApolloClient } from '@apollo/client'
import { useAtom } from 'jotai'
import { ArrowRight, LucideX } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { EditorColourPicker } from './EditorColourPicker'
import { EditorSelect } from './EditorSelect'
import { DEFAULT_MARKER_COLOUR } from './MembersListPointMarkers'
import { useReport } from './ReportProvider'

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
  const { report, updateLayer } = useReport()
  const layer = report.layers?.find((l) => l?.id === layerId)!

  return (
    <div className="divide-y divide-meepGray-600 py-1">
      {/* Inspector config */}
      <section className="my-4 px-4">
        <header className="my-4">
          <h4 className="font-semibold text-white text-sm">Explorer</h4>
          <p className="text-meepGray-400 text-sm pt-2">
            Choose how data should display in the Inspector panel.
          </p>
        </header>

        <EditorSelect
          label={'Display style'}
          value={layer.inspectorType || InspectorDisplayType.Table}
          options={Object.keys(InspectorDisplayType)}
          onChange={(value) => {
            updateLayer(layerId, { inspectorType: value })
          }}
        />
      </section>

      {/* Point config */}
      {layer.sourceData?.dataType !== DataSourceType.AreaStats && (
        <section className="my-4 px-4">
          <header className="my-4">
            <h4 className="font-semibold text-white text-sm">Map markers</h4>
            <p className="text-meepGray-400 text-sm pt-2">
              Choose how data should display on the map.
            </p>
          </header>
          <EditorColourPicker
            label="Marker colour"
            value={layer.mapboxPaint?.['circle-color'] || DEFAULT_MARKER_COLOUR}
            onChange={(value) => {
              if (value !== DEFAULT_MARKER_COLOUR) {
                updateLayer(layerId, {
                  mapboxPaint: {
                    ...layer.mapboxPaint,
                    'circle-color': value,
                  },
                })
              }
            }}
          />
        </section>
      )}
    </div>
  )
}

function DataTab({ layerId }: { layerId: string }) {
  const client = useApolloClient()
  const { report, removeDataSource } = useReport()
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
          removeDataSource(layer?.source!)
        }}
        variant="destructive"
      >
        Remove data source
      </Button>
    </div>
  )
}

const classes = {
  tabsTrigger:
    'pb-2 bg-transparent px-0 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b border-white rounded-none',
}
