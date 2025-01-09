'use client'
import { CRMSelection } from '@/components/CRMButtonItem'
import { Button } from '@/components/ui/button'
import { layerEditorStateAtom } from '@/lib/map'
import { useApolloClient } from '@apollo/client'
import { useAtom } from 'jotai'
import React from 'react'
import useDataSources from '../useDataSources'
import { DEFAULT_MARKER_COLOUR } from './MembersListPointMarkers'

const DataSourcesList: React.FC = () => {
  const client = useApolloClient()
  const { dataSources, removeDataSource } = useDataSources()
  const [layerEditorState, setLayerEditorState] = useAtom(layerEditorStateAtom)

  return (
    <>
      <div className="flex flex-col gap-2">
        {dataSources?.data?.layers?.map(
          (layer, index) =>
            layer?.source && (
              <div
                key={layer?.source?.id || index}
                className="flex gap-2 items-center"
              >
                <Button
                  className="border-l-4 bg-meepGray-800 hover:bg-black p-3 text-sm flex flex-row items-center gap-2 text-left 
                  justify-start overflow-hidden text-nowrap text-ellipsis h-14 w-full"
                  style={{
                    borderColor:
                      layer.mapboxPaint?.['circle-color'] ||
                      DEFAULT_MARKER_COLOUR,
                  }}
                  onClick={() => {
                    if (
                      layerEditorState.open &&
                      layerEditorState.layerId === layer?.id
                    ) {
                      setLayerEditorState({ open: false })
                    } else if (layer.id) {
                      setLayerEditorState({
                        open: true,
                        layerId: layer.id,
                      })
                    }
                  }}
                >
                  <CRMSelection
                    // @ts-ignore: Property 'id' is optional in type 'DeepPartialObject - a silly Fragment typing
                    source={layer.source}
                    isShared={!!layer.sharingPermission}
                  />
                </Button>
              </div>
            )
        )}
      </div>
    </>
  )
}

export default DataSourcesList
