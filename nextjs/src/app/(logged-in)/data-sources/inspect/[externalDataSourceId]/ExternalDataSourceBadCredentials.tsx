import {
  CrmType,
  GoogleSheetsOauthCredentialsQuery,
  GoogleSheetsOauthCredentialsQueryVariables,
  GoogleSheetsOauthUrlQuery,
  GoogleSheetsOauthUrlQueryVariables,
  UpdateExternalDataSourceApiKeyMutationVariables,
} from '@/__generated__/graphql'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toastPromise } from '@/lib/toast'
import { FetchResult, gql, useLazyQuery, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  GOOGLE_SHEETS_OAUTH_CREDENTIALS,
  GOOGLE_SHEETS_OAUTH_URL,
} from '../../create/connect/[externalDataSourceType]/oauthQueries'

export default function ExternalDataSourceBadCredentials({
  id,
  crmType,
  onUpdateCredentials,
}: {
  id: string
  crmType: string
  onUpdateCredentials: () => void
}) {
  const GOOGLE_REDIRECT_URL = `https://${window.location.host}/data-sources/create/connect/editablegooglesheets`

  const [googleSheetsError, setGoogleSheetsError] = useState('')

  const [googleSheetsOauthUrl, googleSheetsOauthUrlResult] = useLazyQuery<
    GoogleSheetsOauthUrlQuery,
    GoogleSheetsOauthUrlQueryVariables
  >(GOOGLE_SHEETS_OAUTH_URL)

  const searchParams = useSearchParams()

  const [googleSheetsOauthCredentials] = useLazyQuery<
    GoogleSheetsOauthCredentialsQuery,
    GoogleSheetsOauthCredentialsQueryVariables
  >(GOOGLE_SHEETS_OAUTH_CREDENTIALS)

  useEffect(() => {
    // Always remove redirect to this page on load
    delete sessionStorage.existingDataSourceOAuthRedirect

    // The presence of these URL parameters indicates an OAuth redirect
    // back from Google. Convert the URL parameters into oauth_credentials using
    // the GoogleSheetsOauthCredentialsQuery, then save them on the data source.
    if (searchParams.get('state') && searchParams.get('code')) {
      const redirectSuccessUrl = new URL(GOOGLE_REDIRECT_URL)
      redirectSuccessUrl.searchParams.set('state', searchParams.get('state')!)
      redirectSuccessUrl.searchParams.set('code', searchParams.get('code')!)
      redirectSuccessUrl.searchParams.set('scope', searchParams.get('scope')!)
      toastPromise(
        googleSheetsOauthCredentials({
          variables: {
            externalDataSourceId: id,
            redirectSuccessUrl: redirectSuccessUrl.toString(),
          },
        }),
        {
          loading: 'Completing Google authorization...',
          success: (d: FetchResult<GoogleSheetsOauthCredentialsQuery>) => {
            if (!d.errors && d.data?.googleSheetsOauthCredentials) {
              onUpdateCredentials()
              return 'Google authorization succeeded'
            }
            throw new Error('Google authorization failed')
          },
          error: () => {
            return 'Google authorization failed'
          },
        }
      )
    }
  }, []) // No dependencies here so useEffect only runs once

  const form = useForm({
    defaultValues: {
      apiKey: '',
    },
    resolver: zodResolver(
      z.object({
        apiKey: z.string(),
      })
    ),
  })

  const [updateExternalDataSource, { loading }] = useMutation(
    UPDATE_EXTERNAL_DATA_SOURCE_API_KEY
  )

  const handleSubmit: SubmitHandler<any> = async (
    { apiKey }: { apiKey: string },
    e
  ) => {
    e?.preventDefault()
    const variables: UpdateExternalDataSourceApiKeyMutationVariables = {
      id,
      apiKey,
    }
    await updateExternalDataSource({ variables })
    onUpdateCredentials()
  }

  return (
    <div>
      <p className="mb-2">
        Your credentials for this data source have expired or been revoked.
      </p>
      {crmType === CrmType.Editablegooglesheets ? (
        <Button
          type="button"
          variant={'reverse'}
          disabled={googleSheetsOauthUrlResult.loading}
          onClick={() => {
            setGoogleSheetsError('')

            const redirectUrl = GOOGLE_REDIRECT_URL
            sessionStorage.existingDataSourceOAuthRedirect =
              window.location.href

            googleSheetsOauthUrl({
              variables: { redirectUrl: redirectUrl.toString() },
            })
              .then(({ data }) => {
                if (!data?.googleSheetsOauthUrl) {
                  throw Error('Missing data')
                }
                window.location.href = data.googleSheetsOauthUrl
              })
              .catch((e) => {
                console.error('Error: ', e)
                setGoogleSheetsError(
                  'Could not get Google authorization URL, please try again.'
                )
              })
          }}
        >
          Authorize
        </Button>
      ) : (
        <Form {...form}>
          <form
            className="pb-4 flex flex-col space-y-5"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Token</FormLabel>
                  <FormControl>
                    <Input placeholder="xxxxxx" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button>Save</Button>
          </form>
        </Form>
      )}
      {googleSheetsError && (
        <small className="text-red-500">{googleSheetsError}</small>
      )}
    </div>
  )
}

const UPDATE_EXTERNAL_DATA_SOURCE_API_KEY = gql`
  mutation UpdateExternalDataSourceApiKey($id: String!, $apiKey: String!) {
    updateExternalDataSourceApiKey(id: $id, apiKey: $apiKey)
  }
`
