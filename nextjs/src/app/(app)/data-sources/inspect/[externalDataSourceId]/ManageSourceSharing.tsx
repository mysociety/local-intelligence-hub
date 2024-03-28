import { DeleteSourceSharingObjectMutation, DeleteSourceSharingObjectMutationVariables, ManageSourceSharingQuery, ManageSourceSharingQueryVariables, SharingPermission, SharingPermissionCudInput, UpdateSourceSharingObjectMutation, UpdateSourceSharingObjectMutationVariables } from '@/__generated__/graphql'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toastPromise } from '@/lib/toast'
import { gql, useApolloClient, useMutation, useQuery } from '@apollo/client'
import { FormProvider, SubmitHandler, useFieldArray, useForm } from 'react-hook-form'

type FormInput = {
  orgs: Array<Partial<SharingPermission>>
}

export function ManageSourceSharing ({
  externalDataSourceId,
}: {
  externalDataSourceId: string
}) {
  const permissions = useQuery<ManageSourceSharingQuery, ManageSourceSharingQueryVariables>(gql`
    query ManageSourceSharing($externalDataSourceId: ID!) {
      externalDataSource(pk: $externalDataSourceId) {
        sharingPermissions {
          id
          organisationId
          organisation {
            name
          }
          externalDataSourceId
          visibilityRecordCoordinates
          visibilityRecordDetails
          deleted
        }
      }
    }
  `, {
    variables: {
      externalDataSourceId,
    }
  })

  const client = useApolloClient()

  const mutatePermission = (data: SharingPermissionCudInput) => {
    toastPromise(
      client.mutate<UpdateSourceSharingObjectMutation, UpdateSourceSharingObjectMutationVariables>({
        mutation: gql`
          mutation UpdateSourceSharingObject($data: SharingPermissionCUDInput!) {
            updateSharingPermission(data: $data) {
              id
              organisationId
              externalDataSourceId
              visibilityRecordCoordinates
              visibilityRecordDetails
              deleted
            }
          }
        `,
        variables: { data }
      }), {
        success: () => {
          permissions.refetch()
          return 'Sharing settings saved'
        },
        loading: 'Saving sharing settings',
        error: 'Error saving share settings',
      }
    )
  }

  function deletePermission (id: string) {
    toastPromise(
      client.mutate<DeleteSourceSharingObjectMutation, DeleteSourceSharingObjectMutationVariables>({
        mutation: gql`
          mutation DeleteSourceSharingObject($pk: String!) {
            deleteSharingPermission(data: { id: $pk }) {
              id
            }
          }
        `,
        variables: { pk: id }
      }), {
        success: () => {
          permissions.refetch()
          return 'Sharing stopped'
        },
        loading: 'Stopping sharing',
        error: 'Error stopping sharing',
      }
    )
  }

  return (
    <div className='space-y-3 divide-y'>
      {permissions.data?.externalDataSource.sharingPermissions.map((permission, index) => (
        <Card className='p-4' key={permission.id}>
          <header className='flex flex-row justify-between items-start gap-2'>
            <div className='font-bold text-lg'>Sharing to {permission.organisation.name}</div>
            <Button variant={'destructive'} onClick={() => {
              deletePermission(permission.id)
            }}>
              Stop sharing
            </Button>
          </header>
          <div key={index} className='flex flex-col gap-2 min-h-14'>
            <div className='flex flex-row gap-1 uppercase font-semibold text-sm text-meepGray-400'>
              <span>Share settings</span>
            </div>
            <div className='flex flex-row gap-1 items-start'>
              <Checkbox
                checked={!!permission.visibilityRecordCoordinates}
                onCheckedChange={() => {
                  mutatePermission({
                    id: permission.id,
                    visibilityRecordCoordinates: !permission.visibilityRecordCoordinates,
                  })
                }}
                id={`checkbox-location-${index}`}
              />
              <label htmlFor={`checkbox-location-${index}`} className='-mt-1'>
                <span>
                  Precise record locations
                </span>
                <p className='text-meepGray-400 text-xs'>
                  If enabled, pins will be placed on a map for each record. If disabled, only aggregate ward / constituency / region data will be shared.  
                </p>
              </label>
            </div>
            <div className='flex flex-row gap-1 items-start'>
              <Checkbox
                checked={!!permission.visibilityRecordDetails}
                onCheckedChange={() => {
                  mutatePermission({
                    id: permission.id,
                    visibilityRecordDetails: !permission.visibilityRecordDetails,
                  })
                }}
                id={`checkbox-details-${index}`}
              />
              <label htmlFor={`checkbox-details-${index}`} className='-mt-1'>
                <span>
                  Record details
                </span>
                <p className='text-meepGray-400 text-xs'>
                  Specific data like {'"'}name{'"'}</p>
              </label>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}