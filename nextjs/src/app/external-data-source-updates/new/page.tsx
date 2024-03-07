'use client';

import { AirtableLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';
import { twMerge } from 'tailwind-merge';
import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewExternalDataSourceUpdateConfigContext } from './layout';
import { externalDataSourceOptions, getSourceOptionForTypename } from '@/lib/data';
import { gql, useQuery } from '@apollo/client';
import { AllExternalDataSourcesQuery } from '@/__generated__/graphql';
import { formatRelative } from 'date-fns';

const ALL_EXTERNAL_DATA_SOURCES = gql`
  query AllExternalDataSources {
    externalDataSources {
      id
      name
      createdAt
      connectionDetails {
        crmType: __typename
        ...on AirtableSource {
          baseId
          tableId
        }
      }
      updateConfigs {
        id
        enabled
      }
    }
  }
`

export default function Page() {
  const router = useRouter()
  const context = useContext(NewExternalDataSourceUpdateConfigContext)
  const crms = useQuery<AllExternalDataSourcesQuery>(ALL_EXTERNAL_DATA_SOURCES)
  const unusedCRMs = crms.data?.externalDataSources
  .filter(d =>
    // Only CRMs without a config
    !d.updateConfigs?.length
  )

  return (
    <div className='space-y-7'>
      <header>
        <h1 className='text-hLg'>Select platform to sync data to</h1>
        <p className='mt-6 text-muted-text max-w-sm'>We currently support the following platforms. If your platform isn’t on this list, <a href='mailto:hello@commonknowledge.coop'>get in touch to see how we can help.</a></p>
      </header>
      {Object.values(externalDataSourceOptions).map((externalDataSource) => (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7'>
          <div onClick={() => {
            context.setConfig(x => ({ ...x, externalDataSourceType: externalDataSource.key as any }))
          }} className={twMerge(
            'cursor-pointer rounded-3xl bg-background-secondary px-10 py-6 overflow-hidden flex flex-row items-center justify-center transition-all hover:border-brand border-2 box-border',
            context.externalDataSourceType === externalDataSource.key && "border-brand border-2"
          )}>
            <externalDataSource.logo className="w-full" />
          </div>
        </div>
      ))}
      {!!unusedCRMs?.length && (
        <section className='space-y-7'>
          <div className='border-b border-background-secondary pt-6' />
          <h2 className='text-hSm'>Or pick up where you left off</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7'>
          {crms.data?.externalDataSources
            .filter(d =>
              // Only CRMs without a config
              !d.updateConfigs?.length
            ).map((externalDataSource) => {
              const Logo = getSourceOptionForTypename(externalDataSource.connectionDetails.crmType)!.logo
              return (
                <article className='cursor-pointer rounded-3xl border-background-tertiary px-6 py-5 space-y-3 transition-all hover:border-brand border-2 box-border' onClick={() => {
                  context.setConfig(x => ({
                    ...x,
                    externalDataSourceType: externalDataSource.connectionDetails.crmType as any,
                    externalDataSourceId: externalDataSource.id
                  }))
                  router.push(`/external-data-source-updates/new/configure/${externalDataSource.id}`)
                }}>
                  <Logo />
                  <div className='text-sm text-muted-text'>
                    <p>Created {formatRelative(externalDataSource.createdAt, new Date())}</p>
                    {!!externalDataSource.connectionDetails.baseId && (
                      <div>
                        <code>{externalDataSource.connectionDetails.baseId}</code><br />
                        <code>{externalDataSource.connectionDetails.tableId}</code>
                      </div>
                    )}
                  </div> 
                </article>
              )
            })}
            </div>
        </section>
      )}
      <Button disabled={!context.externalDataSourceType} variant={'reverse'} onClick={() => {
        router.push(`/external-data-source-updates/new/connect/${context.externalDataSourceType}`)
      }}>Continue</Button>
    </div>
  );
}