'use client';

import { FetchResult, MutationResult, gql, useQuery } from '@apollo/client';
import { useRequireAuth } from '@/components/authenticationHandler';
import { client } from '@/components/apollo-client';
import { AirtableLogo } from '@/components/logos';
import { formatRelative } from 'date-fns'
import { Button, buttonVariants } from '@/components/ui/button';
import { toast } from "sonner"
import { ExternalDataSourceCardSwitch, ExternalDataSourceFullUpdateButton } from '@/components/ExternalDataSourceCard';
import { LoadingIcon } from '@/components/ui/loadingIcon';
import { DeleteSourceMutation, DeleteSourceMutationVariables, ExternalDataSourceUpdateConfigInput, PageForExternalDataSourceUpdateConfigQuery, PageForExternalDataSourceUpdateConfigQueryVariables, UpdateConfigMutation } from '@/__generated__/graphql';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowUpDown, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { globalID } from '@/lib/graphql';
import { UpdateConfigForm } from '@/components/UpdateConfig';

const GET_UPDATE_CONFIG = gql`
  query PageForExternalDataSourceUpdateConfig($ID: ID!) {
    externalDataSourceUpdateConfig(pk: $ID) {
      id
      externalDataSource {
        id
        connectionDetails {
          crmType: __typename
        }
      }
      enabled
      jobs {
        status
        id
        taskName
        args
        lastEventAt
      }
      postcodeColumn
      mapping {
        source
        sourcePath
        destinationColumn
      }
    }
  }
`;

const UPDATE_CONFIG = gql`
  mutation UpdateConfig($config: ExternalDataSourceUpdateConfigInput!) {
    updateExternalDataSourceUpdateConfig(data: $config) {
      id
      postcodeColumn
      mapping {
        source
        sourcePath
        destinationColumn
      }
    }
  }
`;

const DELETE_SOURCE = gql`
  mutation DeleteSource($id: String!) {
    deleteExternalDataSource(data: { id: $id }) {
      id
    }
  }
`;

export default function Page({ params: { externalDataSourceUpdateConfigId } }: { params: { externalDataSourceUpdateConfigId: string }}) {
  const authLoading = useRequireAuth();
  const router = useRouter()

  const { loading, error, data, refetch } = useQuery<PageForExternalDataSourceUpdateConfigQuery, PageForExternalDataSourceUpdateConfigQueryVariables>(GET_UPDATE_CONFIG, {
    variables: {
      ID: externalDataSourceUpdateConfigId
    }
  });

  if (authLoading || loading) {
    return <LoadingIcon />
  }

  if (!data?.externalDataSourceUpdateConfig) {
    return <h2>No data sync found</h2>
  }

  const config = data.externalDataSourceUpdateConfig

  return (
    <div className='p-6 max-w-4xl mx-auto space-y-7'>
      <header className='flex flex-row justify-between gap-8'>
        <div>
          <div className='text-muted-text'>External data source</div>
          <h1 className='text-hLg'>
            {config.externalDataSource.connectionDetails.crmType}
            {config.externalDataSource.connectionDetails.crmType === 'AirtableSource' && (
              <span className='inline-block rounded-xl bg-background-secondary px-10 py-6 overflow-hidden flex flex-row items-center justify-center'>
                <AirtableLogo className="w-30" />
              </span>
            )}
          </h1>
        </div>
      </header>
      <div className='flex flex-row justify-between gap-8'>
        <div className='space-y-3'>
          {config.jobs[0]?.lastEventAt ? (
            <div className='text-muted-text'>
              Last sync: {formatRelative(config.jobs[0].lastEventAt, new Date())} ({config.jobs[0].status})
            </div> 
          ) : null}
          <ExternalDataSourceCardSwitch updateConfig={config} />
        </div>
        <div className='flex flex-row gap-4'>
          <ExternalDataSourceFullUpdateButton id={config.id} />
          <AlertDialog>
            <AlertDialogTrigger>
              <Button variant='destructive'>Permanently delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription className='text-base'>
                  This action cannot be undone. This will permanently delete this configuration from Mapped.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel  className={buttonVariants({ variant: 'outline' })}>Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={() => { del() }} className={buttonVariants({ variant: 'destructive' })}>Confirm delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div className='border-b border-background-secondary pt-10' />
      <section>
        <h2 className='text-hSm mb-5'>Mapping</h2>
        <UpdateConfigForm
          saveButtonLabel="Update"
          initialData={{
            postcodeColumn: config.postcodeColumn,
            // Trim out the __typenames
            mapping: config.mapping.map(m => ({
              source: m.source,
              sourcePath: m.sourcePath,
              destinationColumn: m.destinationColumn
            }))
          }}
          onSubmit={saveConfig}
        />
      </section>
      <div className='border-b border-background-secondary pt-10' />
      <section>
        <h2 className='text-hSm mb-5 flex flex-row items-center gap-3'>
          <span>Logs</span>
          <RefreshCcw className='inline-block cursor-pointer w-4 h-4' onClick={async () => {
            const tid = toast.loading('Refreshing')
            await refetch()
            toast.success('Refreshed', {
              duration: 2000,
              id: tid
            })
          }} />
        </h2>
        <LogsTable data={config.jobs} sortingState={[{desc: true, id: "lastEventAt"}]} columns={[
          { 
            accessorKey: 'lastEventAt',
            header: ({ column }) => {
              return (
                <Button
                  variant="ghost"
                  onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                  Last Update Time
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              )
            },
            cell: (d) => {
              try {
                if (d) {
                  // @ts-ignore
                  return formatRelative(new Date(d.getValue()), new Date())
                }
                return null
              } catch (e) {
                return null
              }
            }
          },
          { header: 'ID', accessorKey: 'id' },
          { header: 'Job', accessorKey: 'taskName' },
          { header: 'Status', accessorKey: 'status' },
          { header: 'Args', accessorKey: 'args', cell: d => <code><pre>{JSON.stringify(d.getValue() || {}, null, 2)}</pre></code> },
        ]} />
      </section>
    </div>
  );

  function del () {
    const mutation = client.mutate<DeleteSourceMutation, DeleteSourceMutationVariables>({
      mutation: DELETE_SOURCE,
      variables: { id: config.externalDataSource.id }
    })
    toast.promise(mutation, {
      loading: 'Deleting...',
      success: (e: MutationResult<DeleteSourceMutation>) => {
        if (!e.error) {
          router.push('/external-data-source-updates')
          return `Deleted sync for ${config.externalDataSource.connectionDetails.crmType}`
        }
      },
      error: `Couldn't delete data source`
    });
  }

  function saveConfig (data: ExternalDataSourceUpdateConfigInput) {
    const update = client.mutate({
      mutation: UPDATE_CONFIG,
      variables: {
        config: {
          ...data,
          id: config.id
        }
      }
    })
    toast.promise(update, {
      loading: 'Updating...',
      success: (d: FetchResult<UpdateConfigMutation>) => {
        if (!d.errors && d.data) {
          return 'Saved config'
        }
      },
      error: `Couldn't save config`
    });
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function LogsTable<TData, TValue>({
  columns,
  data,
  sortingState = []
}: DataTableProps<TData, TValue> & {
  sortingState?: SortingState
}) {
  const [sorting, setSorting] = useState<SortingState>(sortingState)
 
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}