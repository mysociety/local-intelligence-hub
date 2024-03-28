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

  const { displayOptions, setDisplayOptions } = useReportContext();

  const toggleElectionData = () => {
    setDisplayOptions({ showElectionData: !displayOptions.showElectionData });
  };

  const toggleMps = () => {
    setDisplayOptions({ showMPs: !displayOptions.showMPs });
  };

  const layers = useFragment<MapReportLayersSummaryFragment>({
    fragment: MAP_REPORT_LAYERS_SUMMARY,
    fragmentName: "MapReportLayersSummary",
    from: {
      __typename: "MapReport",
      id,
    },
  });
  return (
    <Card className="p-4 bg-meepGray-800 border-1 text-meepGray-200 border border-meepGray-700 w-[248px]">
      <CardHeader>
        <CardTitle className="text-hMd mb-4">Data Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mb-4 py-2 border-t border-meepGray-700 ">
          <div className="label mb-2 text-labelLg flex gap-1 items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="14" viewBox="0 0 9 14" fill="none">
              <path d="M9 4.98127C9 7.45621 6.98528 9.46254 4.5 9.46254C2.01472 9.46254 0 7.45621 0 4.98127C0 2.50633 2.01472 0.5 4.5 0.5C6.98528 0.5 9 2.50633 9 4.98127Z" fill="#969EB0" />
              <path d="M5.01947 13.1963C4.79257 13.6012 4.20763 13.6012 3.98073 13.1963L0.47317 6.93775C0.251904 6.54294 0.538517 6.05678 0.992541 6.05678L8.00766 6.05678C8.46168 6.05678 8.74829 6.54294 8.52703 6.93775L5.01947 13.1963Z" fill="#969EB0" />
            </svg>Your Membership data</div>
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
        <div className="flex flex-col gap-4 mb-4 py-2 border-t border-meepGray-700 ">
          <span className="label mb-2 text-labelLg">Toggle enhancement data</span>
          <div className="text-labelMain"> Mapped data sources</div>
          <div className="text-labelLg text-meepGray-200 flex items-center gap-2">
            <Switch
              checked={displayOptions.showMPs}
              onCheckedChange={toggleMps}
            />Members of Parliament

          </div>
          <div className="text-labelLg text-meepGray-200 flex items-center gap-2">
            <Switch
              checked={displayOptions.showElectionData}
              onCheckedChange={toggleElectionData}
            />
            2019 Election
          </div>
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