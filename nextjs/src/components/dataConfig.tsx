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
import { File, Plus } from "lucide-react"
import { gql, useApolloClient, useFragment, useQuery } from "@apollo/client"
import { AddMapLayerButton } from "./report/AddMapLayerButton"
import { MapReportLayersSummaryFragment } from "@/__generated__/graphql"
import { useContext } from "react"
import { ReportContext } from "@/app/reports/[id]/page"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function DataConfigPanel ({ id }: { id: string}) {
  const { update } = useContext(ReportContext)
  const layers = useFragment<MapReportLayersSummaryFragment>({
    fragment: MapReportLayersSummaryFragmentStr,
    fragmentName: "MapReportLayersSummary",
    from: {
      __typename: "MapReport",
      id,
    },
  });

  return (
    <Card className="p-4 bg-meepGray-800 border-1 text-meepGray-200 border border-meepGray-700">
      <CardHeader>
        <CardTitle className="text-hSm mb-4">Layers</CardTitle>
      </CardHeader>
      <CardContent>

        <div className="flex flex-col gap-2 mb-2 py-2 border-t border-meepGray-700 ">
          <span className="label mb-2">Added layers</span>
          {layers.data.layers?.map((layer) => (
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger>
                  <Button variant="brand" className="p-3 gap-2 text-sm">
                    <File className="w-4" />
                    <span>{layer?.name || layer?.source?.name}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
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
          <span className="label">Data Layers</span>
          <Accordion type="single" collapsible>
            <AccordionItem value="geo">
              <AccordionTrigger>Geographic</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                <div className="items-top flex space-x-2">
                  <Checkbox id="geo-1" />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="geo-1"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Constituency
                    </label>
                  </div>
                </div>
                <div className="items-top flex space-x-2">
                  <Checkbox id="geo-2" />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="geo-2"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Wards
                    </label>
                  </div>
                </div>
                <div className="items-top flex space-x-2">
                  <Checkbox id="geo-3" />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="geo-3"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Something else
                    </label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="dem">
              <AccordionTrigger>Demographic</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                <div className="items-top flex space-x-2">
                  <Checkbox id="geo-1" />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="dem-1"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Nationality
                    </label>
                  </div>
                </div>
                <div className="items-top flex space-x-2">
                  <Checkbox id="dem-2" />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="dem-2"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      income
                    </label>
                  </div>
                </div>
                <div className="items-top flex space-x-2">
                  <Checkbox id="dem-3" />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="dem-3"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Something else
                    </label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </CardContent>
    </Card>
  )

  function addLayer (source: { name: string, id: string }) {
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
    update({ layers: combinedLayers })
  }

  function removeLayer (sourceId: string) {
    const oldLayers = layers.data.layers?.map(l => ({
      name: l!.name!,
      source: l!.source?.id,
    }))
    const newLayers = oldLayers?.filter(l => l.source !== sourceId)
    update({ layers: newLayers })
  }
};

export const MapReportLayersSummaryFragmentStr = gql`
  fragment MapReportLayersSummary on MapReport {
    layers {
      name
      source {
        id
        name
      }
    }
  }
`