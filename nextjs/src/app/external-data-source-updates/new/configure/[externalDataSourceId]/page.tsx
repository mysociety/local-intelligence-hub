'use client';

import { Button } from '@/components/ui/button';
import { twMerge } from 'tailwind-merge';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NewExternalDataSourceUpdateConfigContext } from '../../layout';
import { enrichmentDataSources, externalDataSourceOptions } from "@/lib/data";
import { Form, FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { FetchResult, gql, useMutation, useQuery } from '@apollo/client';
import { CheckIfSourceHasConfigQuery, CheckIfSourceHasConfigQueryVariables, CreateUpdateConfigMutation, CreateUpdateConfigMutationVariables } from '@/__generated__/graphql';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SourcePathSelector } from '@/components/SelectSourceData';
import { ArrowRight, Cross, XCircle } from 'lucide-react';
import { toast } from 'sonner'

const CHECK_UPDATE_CONFIG = gql`
  query CheckIfSourceHasConfig($ID: ID!) {
    externalDataSource(pk: $ID) {
      id
      updateConfigs {
        id
      }
    }
  }
`

const CREATE_UPDATE_CONFIG = gql`
  mutation CreateUpdateConfig($config: ExternalDataSourceUpdateConfigInput!) {
    createExternalDataSourceUpdateConfig(data: $config) {
      id
    }
  }
`

export default function Page({ params: { externalDataSourceId }}: { params: { externalDataSourceId: string }}) {
  const router = useRouter()
  const context = useContext(NewExternalDataSourceUpdateConfigContext)

  const form = useForm<CreateUpdateConfigMutationVariables['config']>({
    defaultValues: {
      externalDataSource: { set: externalDataSourceId },
      enabled: false,
      mapping: []
    }
  })

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray({
    control: form.control,
    name: "mapping",
  });

  const [createConfig, configResult] = useMutation<CreateUpdateConfigMutation, CreateUpdateConfigMutationVariables>(CREATE_UPDATE_CONFIG, {
    variables: {
      config: form.getValues(),
    }
  })

  function submit() {
    console.log(form.getValues())
    const create = createConfig()
    toast.promise(create, {
      loading: 'Saving config...',
      success: (d: FetchResult<CreateUpdateConfigMutation>) => {
        if (!d.errors && d.data) {
          router.push(`/external-data-source-updates/new/${d.data.createExternalDataSourceUpdateConfig.id}/review`)
        }
        return 'Saved config'
      },
      error: `Couldn't save config`
    });
  }

  const checkQuery = useQuery<CheckIfSourceHasConfigQuery, CheckIfSourceHasConfigQueryVariables>(CHECK_UPDATE_CONFIG, {
    variables: {
      ID: externalDataSourceId
    }
  })

  useEffect(() => {
    if (checkQuery.data?.externalDataSource?.updateConfigs?.length) {
      router.push(`/external-data-source-updates/new/${checkQuery.data.externalDataSource.updateConfigs[0].id}/review`)
    }
  }, [checkQuery.data])

  return (
    <FormProvider {...form}>
      <div className='space-y-7'>
        <header>
          <h1 className='text-hLg'>Now configure how you'd like data to be updated</h1>
          <p className='mt-6 text-muted-text max-w-sm'>Choose from the following data sources to enhance your CRM with data that empower you organisation. For geographic data, we need to know which column has the postcode so we can make sure you are getting accurate data.</p>
        </header>
        <Form {...form}>
          {/* <form onSubmit={form.handleSubmit(submit)} className='space-y-7'> */}
            {/* Postcode field */}
            <FormField
              control={form.control}
              name="postcodeColumn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postcode Column</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="postcode" {...field} />
                  </FormControl>
                  <FormDescription>
                    In your external table
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <table>
            {fields.map((field, index) => (
              <tr>
                <td className='w-10'>
                  <Button className='flex-shrink' onClick={() => {
                    remove(index)
                  }}>
                    <XCircle />
                  </Button>
                </td>
                <td className='w-1/2'>
                  <SourcePathSelector
                    sources={enrichmentDataSources}
                    value={{
                      source: form.watch(`mapping.${index}.source`),
                      sourcePath: form.watch(`mapping.${index}.sourcePath`)
                    }}
                    setValue={(source, sourcePath) => {
                      form.setValue(`mapping.${index}.source`, source)
                      form.setValue(`mapping.${index}.sourcePath`, sourcePath)
                    }}
                  />
                </td>
                <td className='w-10'>
                <ArrowRight className='flex-shrink' />
                </td>
                <td className='w-1/2'>
                <Input
                  className='flex-shrink-0 flex-grow'
                  placeholder='Destination column'
                  key={field.id} // important to include key with field's id
                  {...form.register(`mapping.${index}.destinationColumn`)}
                />
                </td>
              </tr>
            ))}
            </table>
            <Button onClick={() => {
              append({
                source: "",
                sourcePath: "",
                destinationColumn: "",
              })
            }}>
              Add field
            </Button>
            <div className='flex flex-row gap-x-'>
              <Button variant='outline' type='reset' onClick={() => {
                router.back()
              }}>Back</Button>
              <Button type='submit' variant={'reverse'} onClick={() => {
                submit()
              }}>
                Continue
              </Button>
            </div>
          {/* </form> */}
        </Form>
      </div>
    </FormProvider>
  );
}