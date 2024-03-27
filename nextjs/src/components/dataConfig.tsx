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
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, ClipboardCopy, File, Plus, Shuffle, X } from "lucide-react"
import { gql, useApolloClient, useFragment, useQuery } from "@apollo/client"
import { AddMapLayerButton } from "./report/AddMapLayerButton"
import { MapReportLayersSummaryFragment } from "@/__generated__/graphql"
import { useContext } from "react"
import { ReportContext } from "@/app/reports/[id]/context"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import Link from "next/link"
import { importData } from "@/app/(app)/data-sources/inspect/[externalDataSourceId]/InspectExternalDataSource"
import { LoadingIcon } from "./ui/loadingIcon"
import { useRouter } from "next/navigation"
import { MAP_REPORT_LAYERS_SUMMARY, isDataConfigOpenAtom, layerColour } from "@/app/reports/[id]/lib"
import { DataSourceIcon } from "./DataSourceIcon"
import pluralize from "pluralize"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { uuid } from 'uuidv4';
import { useAtom } from "jotai"
import { Input } from "./ui/input"
import { toast } from "sonner"
import { CRMSelection } from "./CRMButtonItem"

export default function DataConfigPanel () {
  const router = useRouter()
  const { id, report, updateReport } = useContext(ReportContext)
  const client = useApolloClient()
  const layers = useFragment<MapReportLayersSummaryFragment>({
    fragment: MAP_REPORT_LAYERS_SUMMARY,
    fragmentName: "MapReportLayersSummary",
    from: {
      __typename: "MapReport",
      id,
    },
  });
  const [open, setOpen] = useAtom(isDataConfigOpenAtom)
  const shareURL = () => new URL(`/data-sources/share/${report?.data?.mapReport.organisation.slug}`, window.location.toString()).toString()

  return (
    <Card className="bg-meepGray-800 border-1 text-meepGray-200 border border-meepGray-700">
      <CardHeader className='p-3 flex flex-row justify-between items-center'>
        <CardTitle className="text-hSm font-semibold">Map layers</CardTitle>
        <X className='w-4 cursor-pointer' onClick={() => { setOpen(false) }} />
      </CardHeader>
      <CardContent>
        <div className="p-3 flex flex-col gap-2 border-t border-meepGray-700 ">
          <span className="text-sm mb-2">Your member lists</span>
          {layers.data.layers?.map((layer, index) => layer?.source && (
            <div key={layer?.source?.id || index} className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger>
                  <Button className="border-l-4 bg-none p-3 text-sm flex flex-row items-center gap-2 text-left justify-start overflow-hidden text-nowrap text-ellipsis h-14" style={{
                    borderColor: layerColour(index, layer?.source?.id)
                  }} 
                >
                  <CRMSelection
                    // @ts-ignore: Property 'id' is optional in type 'DeepPartialObject - a silly Fragment typing
                    source={layer.source}
                    isShared={layer.isSharedSource}
                  />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='space-y-4'>
                  {!!layer?.source?.id && (
                    !layer.isSharedSource ? (
                      <>
                        <div>{layer.source.importedDataCount || 0} records imported</div>
                        <Link href={`/data-sources/inspect/${layer?.source?.id}`} className='underline py-2 text-sm'>
                          Inspect data source <ArrowRight />
                        </Link>
                        <Button disabled={layer.source.isImporting} onClick={() => importData(client, layer.source!.id)}>
                          {!layer.source.isImporting ? "Import data" : <span className='flex flex-row gap-2 items-center'>
                            <LoadingIcon size={"18"} />
                            <span>Importing...</span>
                          </span>}
                        </Button>
                      </>
                    ) : (
                      <div className='text-meepGray-400 text-xs'>
                        This data source is managed by {layer.source.organisation?.name}.
                      </div>
                    )
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
      </CardContent>
      <div className='bg-meepGray-700 p-3'>
        <CardHeader>
          <h2 className='text-meepGray-400 flex flex-row gap-1 items-center text-sm'>
            <Shuffle className='w-4'/> Collaborative area
          </h2>
        </CardHeader>
        <CardContent>
          <p className='text-meepGray-300 text-xs py-4'>
            Invite to organisations to share membership lists and collaborate on a campaign together.
          </p>
          <div className="flex gap-2 items-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button size={'sm'} variant='outline' className='text-sm'>
                  <Plus /> Invite
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Request data from other campaigns</DialogTitle>
                  <DialogDescription>
                    Share this URL to request data from other campaigns. They{"'"}ll be able to pick and choose which data sources to share with you, with some data privacy options.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input value={shareURL()} />
                  <Button onClick={() => {
                    navigator.clipboard.writeText(shareURL())
                    toast.success("Copied to clipboard")
                  }}><ClipboardCopy /></Button>
                </div>
                <DialogFooter>
                  <DialogClose onClick={() => {
                    navigator.clipboard.writeText(shareURL())
                    toast.success("Copied to clipboard")
                  }}>
                    Copy and close
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </div>
    </Card>
  )

  function addLayer (source: { name: string, id: string }) {
    const oldLayers = layers.data.layers?.map(l => ({
      id: l!.id!,
      name: l!.name!,
      source: l!.source?.id,
    }))
    const newLayer = {
      name: source.name!,
      source: source.id,
      id: uuid(),
    }
    if (!oldLayers) return
    if (oldLayers.find(l => l.source === source.id)) return
    const combinedLayers = oldLayers?.concat([newLayer])
    updateReport({ layers: combinedLayers })
  }

  function removeLayer (sourceId: string) {
    const oldLayers = layers.data.layers?.map(l => ({
      id: l!.id!,
      name: l!.name!,
      source: l!.source?.id,
    }))
    const newLayers = oldLayers?.filter(l => l.source !== sourceId)
    updateReport({ layers: newLayers })
  }
};