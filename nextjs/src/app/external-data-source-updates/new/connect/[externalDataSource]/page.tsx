'use client';

import { useRequireAuth } from '@/components/authenticationHandler';
import { AirtableLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';
import { twMerge } from 'tailwind-merge';
import { useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UpdateConfigDict, AirtableSourceInput, CreateAirtableSourceMutation, CreateAirtableSourceMutationVariables, TestAirtableSourceQuery, TestAirtableSourceQueryVariables } from '@/__generated__/graphql';
import { Combobox } from '@/components/ui/combobox';
import { TailSpin } from 'react-loader-spinner'
import { FetchResult, gql, useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { client } from '@/components/apollo-client';
import { NewExternalDataSourceUpdateConfigContext } from '../../layout';
import { toast } from "sonner"
import { useForm } from 'react-hook-form'

const TEST_AIRTABLE_SOURCE = gql`
  query TestAirtableSource($apiKey: String!, $baseId: String!, $tableId: String!) {
    testAirtableSource(apiKey: $apiKey, baseId: $baseId, tableId: $tableId)
  }
`

// const CREATE_AIRTABLE_SOURCE = gql`
//   mutation CreateAirtableSource($AirtableSource: AirtableSourceInput!) {
//     createAirtableSource(data: $AirtableSource) {
//       id
//       healthcheck
//     }
//   }
// `

export default function Page({ params: { externalDataSource } }: { params: { externalDataSource: string } }) {
  const router = useRouter()
  const context = useContext(NewExternalDataSourceUpdateConfigContext)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{
    airtable?: Partial<CreateAirtableSourceMutationVariables['AirtableSource']>
  }>()

  const source = watch()

  const [testSource, testSourceResult] = useLazyQuery<TestAirtableSourceQuery, TestAirtableSourceQueryVariables>(TEST_AIRTABLE_SOURCE, {
    variables: {
      apiKey: source.airtable?.apiKey!,
      baseId: source.airtable?.baseId!,
      tableId: source.airtable?.tableId!
    }
  })

  // const [createSource, createSourceResult] = useMutation<CreateAirtableSourceMutation, CreateAirtableSourceMutationVariables>(CREATE_AIRTABLE_SOURCE, {
  //   variables: {
  //     AirtableSource: source as CreateAirtableSourceMutationVariables['AirtableSource']
  //   }
  // })

  async function testConnection () {
    const test = await testSource()
    toast.promise(test, {
      loading: 'Testing connection...',
      success: async (d: FetchResult<CreateAirtableSourceMutation>) => {
        if (!d.data?.createAirtableSource.healthcheck) {
          throw new Error("Connection failed")
        }
        // const source = await createSource()
        // context.setConfig(x => ({ ...x, externalDataSourceId: source.data?.createAirtableSource.id }))
        return 'Connection successful'
      },
      error: 'Connection failed',
      action: {
        text: 'Retry',
        onClick: () => {
          testConnection()
        }
      }
    })
  }

  if (testSourceResult.loading) {
    return (
      <div className='space-y-6'>
        <h1 className='text-hLg'>Testing connection...</h1>
        <p className='text-muted-text max-w-sm'>Please wait whilst we try to connect to your CRM using the information you provided</p>
        <TailSpin
          visible={true}
          height="60"
          width="60"
          color="#444"
          ariaLabel="tail-spin-loading"
          radius="5"
          wrapperStyle={{}}
          wrapperClass=""
        />
      </div>
    )
  }

  if (externalDataSource === 'airtable') {
    return (
      <div>
        <header>
          <h1 className='text-hLg'>Syncing to your Airtable base</h1>
          <p className='mt-6 text-muted-text max-w-sm'>In order to send data across to your Airtable, we’ll need a few details that gives us permission to make updates to your base, as well as tell us which table to update in the first place. You can find out more about how we do this securely here.</p>
        </header>
        <div>
          <label>
            <div>
              <h3>Personal Access Token / API Key</h3>
            </div>
            <input {...register("airtable.apiKey")} className="form-input px-4 py-3 rounded-full" />
            <p className='text-sm'>Make sure your token has read and write permissions for table data, table schema and webhooks. <a href='https://support.airtable.com/docs/creating-personal-access-tokens#:~:text=Click%20the%20Developer%20hub%20option,right%20portion%20of%20the%20screen.'>Learn how to find your personal access token.</a></p>
          </label>
          <label>
            <div>
              <h3>Base ID</h3>
            </div>
            <input {...register("airtable.baseId")} className="form-input px-4 py-3 rounded-full" />
            <p className='text-sm'>The unique identifier for your base. <a href='https://support.airtable.com/docs/en/finding-airtable-ids#:~:text=Finding%20base%20URL%20IDs,-Base%20URLs'>Learn how to find your base ID.</a></p>
          </label>
          <label>
            <div>
              <h3>Table ID</h3>
            </div>
            <input{...register("airtable.tableId")} className="form-input px-4 py-3 rounded-full" />
            <p className='text-sm'>The unique identifier for your table. <a href='https://support.airtable.com/docs/en/finding-airtable-ids#:~:text=Finding%20base%20URL%20IDs,-Base%20URLs'>Learn how to find your table ID.</a></p>
          </label>
        </div>
        {/* Button to test connection */}
        <Button onClick={testConnection}>Test connection</Button>
        <Button onClick={() => {
          router.back()
        }}>Back</Button>
        <Button disabled={!context.externalDataSourceType} variant={'reverse'} onClick={() => {
          router.push(`/external-data-source-updates/new/configure/${context.externalDataSourceId}`)
        }}>Continue</Button>
      </div>
    );
  }

  return null
}