'use client'

import { Check, Locate } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { gql } from '@apollo/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAreasList } from '../useAreasList'
import { useReport } from './ReportProvider'

export default function ReportDashboardConsSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')
  const [searchQuery, setSearchQuery] = React.useState('')

  const { report } = useReport()
  const boundaryType = report.displayOptions?.dataVisualisation?.boundaryType

  console.log('boundaryType:', boundaryType)

  const tileset = report.politicalBoundaries.find(
    (boundary) => boundary.boundaryType === boundaryType
  )?.tileset
  console.log('tileset:', tileset)

  const areas = useAreasList(tileset ?? null)
  console.log('areas:', areas)

  // Get the area ID from URL params
  React.useEffect(() => {
    const entity = searchParams.get('entity')
    const id = searchParams.get('id')

    if (entity === 'area' && id) {
      const area = areas.find((area) => area.gss === id)
      if (area) {
        setValue(area.name)
      }
    }
  }, [searchParams, areas])

  const handleSelect = (value: string) => {
    const valueUpper = value.toUpperCase()
    const area = areas.find((area) => area.gss === valueUpper)
    setValue(area?.name ?? '')
    setOpen(false)

    // Create new URLSearchParams object with current params
    const params = new URLSearchParams(searchParams)
    params.set('entity', 'area')
    params.set('id', valueUpper)
    params.set('showExplorer', 'true')

    // Update the URL
    router.push(`?${params.toString()}`)
  }

  //  // Keyboard shortcuts
  //   useEffect(() => {
  //     const down = (e: KeyboardEvent) => {
  //       if (e.key === 'Backspace' && (e.metaKey || e.ctrlKey)) {
  //         e.preventDefault()

  //         setSelectedBoundary(null)
  //       }
  //       if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
  //         e.preventDefault()
  //         setOpen((open) => !open)
  //       }
  //     }
  //     document.addEventListener('keydown', down)
  //     return () => document.removeEventListener('keydown', down)
  //   }, [])

  //   useEffect(() => {
  //     if (selectedBoundary) {
  //       const gssAreaID = getGSSAreaIDfromGSS(selectedBoundary)
  //       if (gssAreaID) {
  //         setValue(gssAreaID)
  //       }
  //     }
  //     if (!selectedBoundary) {
  //       setValue('')
  //     }
  //   }, [selectedBoundary])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex  gap-1 items-center">
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className=" justify-between text-sm font-normal w-full hover:bg-meepGray-800 text-opacity-80 "
          >
            <Locate className="ml-2 h-4 w-4 shrink-0 opacity-50" />

            <div className="flex items-center gap-1">
              <span className="truncate =">
                {value ? value : 'Select Constituency'}
              </span>
            </div>
            {!value && <div className="text-xs text-meepGray-400">CMD+K</div>}
          </Button>
        </PopoverTrigger>

        {/* {selectedBoundary && (
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedBoundary(null)
              setValue('')
            }}
            className="text-xs font-normal flex items-center gap-1 bg-meepGray-600 px-2 py-1 text-red-200 hover:bg-white hover:text-red-400"
          >
            <X className="w-3 h-3" />
            CLEAR
            <div className="text-meepGray-400">| CMD+BACKSPACE</div>
          </Button>
        )} */}
      </div>

      <PopoverContent className="w-full  p-0" align="end">
        <Command>
          <CommandInput
            placeholder="Search constituencies..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No constituency found.</CommandEmpty>
            <CommandGroup>
              {areas.map((area) => (
                <CommandItem
                  key={area.gss}
                  value={area.gss}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === area.gss ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {area.name}
                  {/* <span className="text-xs text-brandBlue ml-2">
                    {area.count > 0 && ` ${area.count}`}
                  </span> */}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Same query from TopConstituencies
const CONSTITUENCY_STATS_OVERVIEW = gql`
  query ConstituencyStatsOverview(
    $reportID: ID!
    $analyticalAreaType: AnalyticalAreaType!
    $layerIds: [String!]!
  ) {
    mapReport(pk: $reportID) {
      id
      importedDataCountByConstituency: importedDataCountByArea(
        analyticalAreaType: $analyticalAreaType
        layerIds: $layerIds
      ) {
        label
        gss
        count
        gssArea {
          id
          name
          fitBounds
          mp: person(filters: { personType: "MP" }) {
            id
            name
            photo {
              url
            }
            party: personDatum(filters: { dataType_Name: "party" }) {
              name: data
            }
          }
          lastElection {
            stats {
              date
              majority
              electorate
              firstPartyResult {
                party
                shade
                votes
              }
              secondPartyResult {
                party
                shade
                votes
              }
            }
          }
        }
      }
    }
  }
`

const RECORD_EXPLORER_SUMMARY = gql`
  query RecordExplorerSummary($id: String!) {
    import: importedDataGeojsonPoint(genericDataId: $id) {
      id
      geometry {
        type
        coordinates
      }
      record: properties {
        id
        dataType {
          id
          name
          dataSet {
            id
            externalDataSource {
              id
              name
              organisation {
                id
                name
              }
              crmType
              dataType
            }
          }
        }
        postcode
        postcodeData {
          adminWard
          adminDistrict
          europeanElectoralRegion
          codes {
            adminWard
            adminDistrict
          }
        }
        title
        firstName
        lastName
        fullName
        email
        phone
        startTime
        endTime
        publicUrl
        address
        description
        json
        remoteUrl
      }
    }
  }
`
