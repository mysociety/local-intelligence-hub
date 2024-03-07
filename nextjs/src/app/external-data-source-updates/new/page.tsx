'use client';

import { AirtableLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';
import { twMerge } from 'tailwind-merge';
import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewExternalDataSourceUpdateConfigContext, externalDataSourceOptions } from './layout';

export default function Page() {
  const router = useRouter()
  const context = useContext(NewExternalDataSourceUpdateConfigContext)
  return (
    <div>
      <header>
        <h1 className='text-hLg'>Select platform to sync data to</h1>
        <p className='mt-6 text-muted-text max-w-sm'>We currently support the following platforms. If your platform isn’t on this list, <a href='mailto:hello@commonknowledge.coop'>get in touch to see how we can help.</a></p>
      </header>
      {Object.values(externalDataSourceOptions).map((externalDataSource) => (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7'>
          <div onClick={() => {
            context.setConfig(x => ({ ...x, externalDataSourceType: externalDataSource.key as any }))
          }} className={twMerge(
            'cursor-pointer rounded-3xl bg-background-secondary px-10 py-6 overflow-hidden flex flex-row items-center justify-center transition-all hover:border-brand hover:border-2',
            context.externalDataSourceType === externalDataSource.key && "border-brand border-2"
          )}>
            <externalDataSource.logo className="w-full" />
          </div>
        </div>
      ))}
      <Button disabled={!context.externalDataSourceType} variant={'reverse'} onClick={() => {
        router.push(`/external-data-source-updates/new/connect/${context.externalDataSourceType}`)
      }}>Continue</Button>
    </div>
  );
}