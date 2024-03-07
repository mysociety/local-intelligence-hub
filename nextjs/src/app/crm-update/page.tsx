'use client';

import { FetchResult, gql, useQuery } from '@apollo/client';
import { useRequireAuth } from '@/components/authenticationHandler';
import { DisableUpdateConfigMutation, DisableUpdateConfigMutationVariables, EnableUpdateConfigMutation, EnableUpdateConfigMutationVariables, ListUpdateConfigsQuery } from '@/__generated__/graphql';
import { Switch } from '@/components/ui/switch';
import { client } from '@/components/apollo-client';
import { ActionNetworkLogo, AirtableLogo } from '@/components/logos';
import { formatRelative } from 'date-fns'
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { toast } from "sonner"

const LIST_DATA_SYNCS = gql`
  query ListUpdateConfigs {
    externalDataSourceUpdateConfigs {
      externalDataSource {
        id
        __typename
        connectionDetails {
          crmType: __typename
        }
      }
      id
      enabled
      events {
        scheduledAt
        status
      }
    }
  }
`;

const ENABLE_UPDATE_CONFIG = gql`
  mutation EnableUpdateConfig($ID: String!) {
    enableUpdateConfig(configId: $ID) {
      id
      enabled
      externalDataSource {
        connectionDetails {
          crmType: __typename
        }
      }
    }
  } 
`

const DISABLE_UPDATE_CONFIG = gql`
  mutation DisableUpdateConfig($ID: String!) {
    disableUpdateConfig(configId: $ID) {
      id
      enabled
      externalDataSource {
        connectionDetails {
          crmType: __typename
        }
      }
    }
  } 
`

export default function Page() {
  const authLoading = useRequireAuth();

  const { loading, error, data } = useQuery<ListUpdateConfigsQuery>(LIST_DATA_SYNCS);

  if (authLoading) {
    return <h2>Loading...</h2>
  }

  function switchUpdateConfig (checked: boolean, id: any) {
    if (checked) {
      const mutation = client.mutate<EnableUpdateConfigMutation, EnableUpdateConfigMutationVariables>({
        mutation: ENABLE_UPDATE_CONFIG,
        variables: { ID: id }
      })
      toast.promise(mutation, {
        loading: 'Enabling...',
        success: (d: FetchResult<EnableUpdateConfigMutation>) => {
          return `Enabled syncing for ${d.data?.enableUpdateConfig.externalDataSource.connectionDetails.crmType}`;
        },
        error: `Couldn't enable syncing`
      });
    } else {
      const mutation = client.mutate<DisableUpdateConfigMutation, DisableUpdateConfigMutationVariables>({
        mutation: DISABLE_UPDATE_CONFIG,
        variables: { ID: id }
      })
      toast.promise(mutation, {
        loading: 'Disabling...',
        success: (d: FetchResult<DisableUpdateConfigMutation>) => {
          return `Disabled syncing for ${d.data?.disableUpdateConfig.externalDataSource.connectionDetails.crmType}`;
        },
        error: `Couldn't disable syncing`
      });
    }
  }

  return (
    <div className='p-6 max-w-6xl mx-auto space-y-7'>
      <PageHeader />
      <div className='border-b border-background-secondary pt-10' />
      <h2 className='text-hSm'>Active Syncs</h2>
      {loading ? (
        <section className='grid gap-7 grid-cols-1 sm:grid-cols-2 md:grid-cols-4'>
          <article className='rounded-xl border border-background-tertiary px-6 py-5 space-y-3'>
            <Skeleton className="h-4 w-full max-w-[100px]" />
            <Skeleton className="h-10 w-full" />
          </article>
          <CreateNewSyncButton />
        </section>
      ) : error ? (
        <h2>Error: {error.message}</h2>
      ) : data ? (
        <section className='grid gap-7 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          {data.externalDataSourceUpdateConfigs.map(updateConfig => (
            <article key={updateConfig.id} className='rounded-xl border border-background-tertiary px-6 py-5 space-y-3'>
              <h3 className='text-hSm'>{updateConfig.externalDataSource.connectionDetails.crmType}</h3>
              {updateConfig.events[0]?.scheduledAt ? (
                <div className='text-sm text-muted-text'>
                  Last sync: {formatRelative(updateConfig.events[0].scheduledAt, new Date())} ({updateConfig.events[0].status})
                </div> 
              ) : null}
              <Switch checked={updateConfig.enabled} onCheckedChange={e => switchUpdateConfig(e, updateConfig.id)}>{updateConfig.enabled ? 'Enabled' : 'Disabled'}</Switch>
            </article>
          ))}
          <CreateNewSyncButton />
        </section>
      ) : null}
    </div>
  );
}

function PageHeader () {
  return (
    <header className='grid grid-rows-2 md:grid-rows-1 md:grid-cols-2  gap-8'>
      <div>
        <h1 className='text-hLg'>CRM Data Updates</h1>
        <p className='mt-6 text-muted-text max-w-sm'>Maximise your organisations impact by securely connecting your CRM platforms with Mapped and select from a range of data sources to enhance your membership lists.</p>
      </div>
      <div className='grid grid-cols-2 gap-7'>
        <div className='rounded-3xl bg-background-secondary px-10 py-6 overflow-hidden flex flex-row items-center justify-center'>
          <ActionNetworkLogo className="w-full" />
        </div>
        <div className='rounded-3xl bg-background-secondary px-10 py-6 overflow-hidden flex flex-row items-center justify-center'>
          <AirtableLogo className="w-full" />
        </div>
      </div>
    </header>
  )
}

function CreateNewSyncButton () {
  return (
    <Link href='/crm-update/new'>
      <article className='relative cursor-pointer rounded-xl border border-background-tertiary px-6 py-5'>
        <div className='space-y-5'>
          <Skeleton className="h-4 w-full max-w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className='absolute inset-0 top-1/2 -translate-y-1/2 flex items-center justify-center'>
          <Button variant='reverse' className='shadow-md'>+ Create new sync</Button>
        </div>
      </article>
    </Link>
  )
}