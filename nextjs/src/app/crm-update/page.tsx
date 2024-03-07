'use client';

import { gql, useQuery } from '@apollo/client';
import { useRequireAuth } from '../../components/authenticationHandler';
import { ListDataSyncsQuery } from '@/__generated__/graphql';
import { Switch } from '@/components/ui/switch';
import { client } from '@/components/apollo-client';
import { ActionNetworkLogo, AirtableLogo } from '@/components/logos';
import { formatRelative } from 'date-fns'

const LIST_DATA_SYNCS = gql`
  query ListDataSyncs {
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

export default function Page() {
  const authLoading = useRequireAuth();

  const { loading, error, data } = useQuery<ListDataSyncsQuery>(LIST_DATA_SYNCS);

  if (authLoading) {
    return <h2>Loading...</h2>
  }

  function switchUpdateConfig (checked: boolean, id: any) {
    if (checked) {
      client.mutate({
        mutation: gql`
          mutation EnableUpdateConfig($ID: String!) {
            enableUpdateConfig(configId: $ID) {
              id
              enabled
            }
          } 
        `,
        variables: { ID: id }
      })
    } else {
      client.mutate({
        mutation: gql`
          mutation EnableUpdateConfig($ID: String!) {
            disableUpdateConfig(configId: $ID) {
              id
              enabled
            }
          } 
        `,
        variables: { ID: id }
      })
    }
  }

  return (
    <div className='p-6 max-w-6xl mx-auto space-y-7'>
      <PageHeader />
      <div className='border-b border-background-secondary pt-10' />
      <h2 className='text-hSm'>Active Syncs</h2>
      {loading && <h2>Loading...</h2>}
      {error && <h2>Error: {error.message}</h2>}
      {data && (
        <ul className='grid gap-7 grid-cols-1 sm:grid-cols-2 md:grid-cols-4'>
          {data.externalDataSourceUpdateConfigs.map(updateConfig => (
            <li key={updateConfig.id} className='rounded-xl border border-background-tertiary px-6 py-5 space-y-3'>
              <h3 className='text-hSm'>{updateConfig.externalDataSource.connectionDetails.crmType}</h3>
              {updateConfig.events[0]?.scheduledAt ? (
                <div className='text-sm text-muted-text'>
                  Last sync: {formatRelative(updateConfig.events[0].scheduledAt, new Date())} ({updateConfig.events[0].status})
                </div> 
              ) : null}
              <Switch checked={updateConfig.enabled} onCheckedChange={e => switchUpdateConfig(e, updateConfig.id)}>{updateConfig.enabled ? 'Enabled' : 'Disabled'}</Switch>
            </li>
          ))}
        </ul>
      )}
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