"use client"

import { GetMemberListQuery, MapReportLayersSummaryFragment } from "@/__generated__/graphql"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { gql, useFragment, useQuery } from "@apollo/client"
import { useContext, useState } from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Form, useForm } from "react-hook-form"
import { FormField } from "../ui/form"
import { ReportContext } from "@/app/reports/[id]/context"
import { useRouter } from "next/navigation"
import { MAP_REPORT_LAYERS_SUMMARY } from "@/app/reports/[id]/lib"
import { DataSourceIcon } from "../DataSourceIcon"
import pluralize from "pluralize"

type Source = {
  name: string,
  id: string
}

export function AddMapLayerButton({ addLayer }: { addLayer(layer: Source): void }) {
  const { id  } = useContext(ReportContext)
  const form = useForm<{ source?: Source }>()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="w-4" /> Add map layer
        </Button>
      </DialogTrigger>
      <Form {...form}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={form.handleSubmit(d => {
            setOpen(false)
            if (!d.source) return 
            addLayer(d.source)
          })}>
            <DialogHeader>
              <DialogTitle>Add map layer</DialogTitle>
              <DialogDescription>
                Select from existing sources or add a new one
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <MapLayerSelector value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Add layer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Form>
    </Dialog>
  )
}

export function MapLayerSelector ({ value, onChange }: { value?: Source, onChange: (value: Source) => void }) {
  const [open, setOpen] = useState(false)
  const { id, report } = useContext(ReportContext)
  const dataSources = useQuery<GetMemberListQuery>(MEMBER_LISTS)
  const selectedSource = dataSources.data?.externalDataSources.find(s => s.id === value?.id)
  const router = useRouter()
  const layers = useFragment<MapReportLayersSummaryFragment>({
    fragment: MAP_REPORT_LAYERS_SUMMARY,
    fragmentName: "MapReportLayersSummary",
    from: {
      __typename: "MapReport",
      id,
    },
  });
 
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {value
            ? "Selected: " + selectedSource?.name
            : "Select data source"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command className='w-full'>
          <CommandInput placeholder="Search your data sources..." />
          <CommandEmpty onClick={() => {
            router.push("/data-sources/create?dataType=MEMBER")
          }}>
            No data sources found. Click to connect.
          </CommandEmpty>
          <CommandGroup>
            {dataSources.data?.externalDataSources
            // .filter(s => !report?.data?.mapReport?.layers?.some(sL => sL.source.id === s.id))
            .map((source) => {
              const alreadySelected = source.id === value
              const alreadyUsed = layers.data?.layers?.some(sL => sL?.source?.id === source.id)
              return (
                <CommandItem
                  key={source.id}
                  disabled={alreadySelected || alreadyUsed}
                  onSelect={() => {
                    onChange(source)
                    setOpen(false)
                  }}
                  className="flex flex-row items-center gap-1"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      alreadySelected || alreadyUsed ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <DataSourceIcon connectionType={source.connectionDetails.__typename} className="w-5" />
                  &nbsp;
                  <div className='-space-y-1'>
                    <div>{source.name}</div>
                    {!!source?.importedDataCount && (
                      <div className='text-meepGray-400 text-xs'>
                        {source?.importedDataCount} {pluralize("member", source?.importedDataCount)}
                      </div>
                    )}
                  </div>
                </CommandItem>
              )
            })}
            <CommandItem
              onSelect={() => {
                router.push("/data-sources/create?dataType=MEMBER")
              }}
            >
              <Plus className={"mr-2 h-4 w-4"} />
              Connect a new data source
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

const MEMBER_LISTS = gql`
  query GetMemberList {
    externalDataSources(filters: { dataType: MEMBER }) {
      id
      name
      importedDataCount
      connectionDetails {
        __typename
      }
    }
  }
`