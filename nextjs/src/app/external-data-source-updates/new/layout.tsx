'use client';

import { useRequireAuth } from '@/components/authenticationHandler';
import { AirtableLogo } from '@/components/logos';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createContext } from 'react';

type UpdateConfigDict = {
  externalDataSourceType: 'airtable'
  externalDataSourceId: string,
  externalDataSourceUpdateConfigId: string
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
    { externalDataSourceType, externalDataSourceId, externalDataSourceUpdateConfigId },
    setConfig
  ] = useState<Partial<UpdateConfigDict>>({ externalDataSourceType: undefined, externalDataSourceId: undefined, externalDataSourceUpdateConfigId: undefined})

  if (authLoading) {
    return <h2>Loading...</h2>
  }

  return (
    <NewExternalDataSourceUpdateConfigContext.Provider value={{
      externalDataSourceType,
      externalDataSourceId,
      externalDataSourceUpdateConfigId,
      setConfig
    }}>
      <div className='p-6 max-w-6xl mx-auto flex flex-row gap-7'>
        <aside className='w-[180px]'>
          <Step number={1} state={
            externalDataSourceType ? 'completed' : 'active'
          }>
            Choose platform
          </Step>
          <Step number={2} state={
            externalDataSourceId ? 'completed' : externalDataSourceType ? 'active' : 'disabled'
          }>
            Provide information
          </Step>
          <Step number={3} state={
            externalDataSourceUpdateConfigId ? 'completed' : externalDataSourceId ? 'active' : 'disabled'
          }>
            Select data layers
          </Step>
          <Step number={4} state={
            externalDataSourceUpdateConfigId ? 'active' : 'disabled'
          }>
            Activate sync
          </Step>
        </aside>
        <main className='space-y-7'>
          {children}
        </main>
      </div>
    </NewExternalDataSourceUpdateConfigContext.Provider>
  );
}

export function Step ({ number, state, children }: {
  number: number
  state: 'active' | 'completed' | 'disabled'
  children: React.ReactNode
}) {
  return (
    <div className={state === 'active' ? 'bg-white' : state === 'completed' ? 'bg-muted' : 'bg-gray-800'}>
      <div className='flex items-center gap-2'>
        <span className='text-2xl bg-muted-text text-white rounded w-10 h-10 inline-flex items-center justify-center'>{number}</span>
        <span>{children}</span>
      </div>
    </div>
  )
}