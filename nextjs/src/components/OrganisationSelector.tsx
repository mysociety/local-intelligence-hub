"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { gql, useQuery } from "@apollo/client"
import { LoadingIcon } from "./ui/loadingIcon"
import { GetOrganisationsQuery } from "@/__generated__/graphql"
import { currentOrganisationAtom } from "@/data/organisation"
import { useAtom } from "jotai"
import { ArrowDown, ChevronDown } from "lucide-react"

export function OrganisationSelector() {
  const organisations = useQuery<GetOrganisationsQuery>(GET_ORGANISATIONS)
  const [currentOrganisation, setOrg] = useAtom(currentOrganisationAtom)

  React.useEffect(() => {
    if ((!currentOrganisation || currentOrganisation === "?") && organisations.data?.myOrganisations.length) {
      setOrg(organisations.data.myOrganisations[0].id)
    }
  }, [currentOrganisation, organisations])

  const selectedOrgData = organisations.data?.myOrganisations.find((org) => org.id === currentOrganisation)

  if (organisations.loading || !currentOrganisation || !selectedOrgData) return (
    <div className='flex flex-row'>
        <LoadingIcon className='w-4' />
        Loading organisations
    </div>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className='border-x border-meepGray-700 px-6 py-2 flex flex-col items-center justify-center cursor-pointer hover:bg-meepGray-700'>
            <div className='flex flex-row gap-2 items-center'>
                <span>{selectedOrgData?.name}</span>
                <ChevronDown className='w-4 text-meepGray-400' />
            </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Your organisations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={currentOrganisation} onValueChange={setOrg}>
        {organisations.data?.myOrganisations.map((organisation) => (
            <DropdownMenuRadioItem key={organisation.id} value={organisation.id} className='py-3 text-md'>
                {organisation.name}
            </DropdownMenuRadioItem>
        ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const GET_ORGANISATIONS = gql`
    query GetOrganisations {
        myOrganisations {
            id
            name
        }
    }
`