"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, File, Plus } from "lucide-react"
import { gql, useApolloClient, useFragment, useQuery } from "@apollo/client"
import { AddMapLayerButton } from "./report/AddMapLayerButton"
import { MapReportLayersSummaryFragment } from "@/__generated__/graphql"
import { useContext, useState } from "react"
import { ReportContext, useReportContext } from "@/app/reports/[id]/context"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Link from "next/link"
import { importData } from "@/app/(app)/data-sources/inspect/[externalDataSourceId]/InspectExternalDataSource"
import { LoadingIcon } from "./ui/loadingIcon"
import { useRouter } from "next/navigation"
import { MAP_REPORT_LAYERS_SUMMARY, layerColour } from "@/app/reports/[id]/lib"

export default function DataConfigPanel() {
  const router = useRouter()
  const { id, updateReport } = useContext(ReportContext)
  const client = useApolloClient()
  const { showElectionData, setShowElectionData } = useReportContext();

  const layers = useFragment<MapReportLayersSummaryFragment>({
    fragment: MAP_REPORT_LAYERS_SUMMARY,
    fragmentName: "MapReportLayersSummary",
    from: {
      __typename: "MapReport",
      id,
    },
  });

  return (
    <Card className="p-4 bg-meepGray-800 border-1 text-meepGray-200 border border-meepGray-700">
      <CardHeader>
        <CardTitle className="text-hSm mb-4">Data Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 mb-2 py-2 border-t border-meepGray-700 ">
          <span className="label mb-2">Your Membership data</span>
          {layers.data.layers?.map((layer, index) => (
            <div key={layer?.source?.id || index} className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger>
                  <Button className="p-3 gap-2 text-sm" style={{
                    background: layerColour(index, layer?.source?.id)
                  }}>
                    <File className="w-4" />
                    <span>{layer?.name || layer?.source?.name}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='space-y-4'>
                  {!!layer?.source?.id && (
                    <>
                      <div>{layer.source.importedDataCount || 0} records imported</div>
                      <Button onClick={() => router.push(`/data-sources/inspect/${layer?.source?.id}`)}>
                        Inspect data source <ArrowRight />
                      </Button>
                      <Button disabled={layer.source.isImporting} onClick={() => importData(client, layer.source!.id)}>
                        {!layer.source.isImporting ? "Import data" : <span className='flex flex-row gap-2 items-center'>
                          <LoadingIcon size={"18"} />
                          <span>Importing...</span>
                        </span>}
                      </Button>
                    </>
                  )}
                  <Button onClick={() => {
                    removeLayer(layer?.source?.id!)
                  }} variant='destructive'>Remove layer</Button>
                </PopoverContent>
              </Popover>
            </div>
          ))}
          <div className="flex gap-2 items-center">
            <AddMapLayerButton addLayer={addLayer} />
          </div>
        </div>
        <div className="flex flex-col gap-2 mb-2 py-2 border-t border-meepGray-700 ">
          <span className="label mb-2">Toggle enhancement data</span>
          <div> Mapped data sources</div>
          <p>Members of Parliament</p>
          <Switch />
          <p>2019 Election</p>
          <Switch
            checked={showElectionData}
            onCheckedChange={(newCheckedState) => setShowElectionData(newCheckedState)}
          />
        </div>
      </CardContent>
    </Card>
  )

  function addLayer(source: { name: string, id: string }) {
    const oldLayers = layers.data.layers?.map(l => ({
      name: l!.name!,
      source: l!.source?.id,
    }))
    const newLayer = {
      name: source.name!,
      source: source.id,
    }
    if (!oldLayers) return
    if (oldLayers.find(l => l.source === source.id)) return
    const combinedLayers = oldLayers?.concat([newLayer])
    updateReport({ layers: combinedLayers })
  }

  function removeLayer(sourceId: string) {
    const oldLayers = layers.data.layers?.map(l => ({
      name: l!.name!,
      source: l!.source?.id,
    }))
    const newLayers = oldLayers?.filter(l => l.source !== sourceId)
    updateReport({ layers: newLayers })
  }
};