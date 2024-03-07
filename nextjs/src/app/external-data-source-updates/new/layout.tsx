'use client';

import { useRequireAuth } from '@/components/authenticationHandler';
import { AirtableLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AirtableSourceInput, CreateAirtableSourceMutation, CreateAirtableSourceMutationVariables } from '@/__generated__/graphql';
import { Combobox } from '@/components/ui/combobox';
import { TailSpin } from 'react-loader-spinner'
import { gql } from '@apollo/client';
import { client } from '@/components/apollo-client';
import Link from 'next/link';
import { createContext } from 'react';

type UpdateConfigDict = {
  externalDataSourceType: 'airtable'
  externalDataSourceId: string
}

export const NewExternalDataSourceUpdateConfigContext = createContext<Partial<UpdateConfigDict> & { 
  setConfig: React.Dispatch<React.SetStateAction<Partial<UpdateConfigDict>>>
}>({
  setConfig: () => {}
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const authLoading = useRequireAuth();
  const router = useRouter()
  const pathname = usePathname()
  const [
    { externalDataSourceType, externalDataSourceId },
    setConfig
  ] = useState<Partial<UpdateConfigDict>>({ externalDataSourceType: undefined, externalDataSourceId: undefined })

  if (authLoading) {
    return <h2>Loading...</h2>
  }

  return (
    <NewExternalDataSourceUpdateConfigContext.Provider value={{
      externalDataSourceType,
      externalDataSourceId,
      setConfig
    }}>
      <div className='p-6 max-w-6xl mx-auto flex flex-row gap-7'>
        <aside className='w-[180px]'>
          <Link className={`link ${pathname === '/' ? 'bg-yellow-500' : ''}`} href="/external-data-source-updates/new">
            Choose platform
          </Link>
          <Link className={`link ${pathname === '/' ? 'bg-yellow-500' : ''}`} href={`/external-data-source-updates/new/connect/${externalDataSourceType}`}>
            Provide information
          </Link>
          <Link className={`link ${pathname === '/' ? 'bg-yellow-500' : ''}`} href={`/external-data-source-updates/new/${externalDataSourceId}/configure`}>
            Select data layers
          </Link>
          <Link className={`link ${pathname === '/' ? 'bg-yellow-500' : ''}`} href={`/external-data-source-updates/new/${externalDataSourceId}/review`}>
            Activate sync
          </Link>
        </aside>
        <main className='space-y-7'>
          {children}
        </main>
      </div>
    </NewExternalDataSourceUpdateConfigContext.Provider>
  );
}

export const dataLayers = {
  "postcodes.io": {
    key: "postcodes.io",
    name: "Postcodes.io",
    data: [
      "postcode",
      "parliamentary_constituency"
    ]
  }
}

export const externalDataSourceOptions = {
  airtable: {
    key: 'airtable',
    name: 'Airtable',
    logo: AirtableLogo
  }
}