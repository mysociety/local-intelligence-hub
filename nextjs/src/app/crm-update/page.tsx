'use client';

import { gql, useQuery } from '@apollo/client';
import { useRequireAuth } from '../../components/authenticationHandler';
import { ListDataSyncsQuery } from '@/__generated__/graphql';

const LIST_DATA_SYNCS = gql`
  query ListDataSyncs {
    organisations {
      id
      name
    }
    externalDataSourceUpdateConfigs {
      externalDataSource {
        id
        __typename
      }
      id
      enabled
      events(pagination: { limit: 3 }) {
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

  return (
    <>
      <h1 className='text-2xl'>Active syncs</h1>
      {loading && <h2>Loading...</h2>}
      {error && <h2>Error: {error.message}</h2>}
      {data && (
        <ul>
          {data.externalDataSourceUpdateConfigs.map(updateConfig => (
            <li key={updateConfig.id}>
              <b>{updateConfig.externalDataSource.__typename}</b>
              {updateConfig.externalDataSource.id} - {updateConfig.enabled ? 'Enabled' : 'Disabled'}
              {updateConfig.events.length > 0 && (
                <ul>
                  {updateConfig.events.map((log: any) => (
                    <li key={log.scheduledAt}>
                      {log.scheduledAt} - {log.status}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}