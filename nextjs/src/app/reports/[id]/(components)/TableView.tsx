import {
  AnalyticalAreaType,
  ChoroplethMode,
  SourceStatsByBoundaryQuery,
  SourceStatsByBoundaryQueryVariables,
} from '@/__generated__/graphql'
import { useReport } from '@/lib/map/useReport'
import { useQuery } from '@apollo/client'
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { SpecificViewConfig, ViewType } from '../reportContext'
import { CHOROPLETH_STATS_FOR_SOURCE } from '../useDataByBoundary'

import { flexRender } from '@tanstack/react-table'

import { CRMSelection } from '@/components/CRMButtonItem'
import { Button } from '@/components/ui/button'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import { DataTablePagination } from '@/components/ui/pagination'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useExplorer } from '@/lib/map/useExplorer'
import { useView } from '@/lib/map/useView'
import { ArrowUpDown, LucideBoxSelect, Settings2, Star } from 'lucide-react'
import pluralize from 'pluralize'
import { useMemo } from 'react'
import { twMerge } from 'tailwind-merge'
import toSpaceCase from 'to-space-case'
import { EditorSelect } from './EditorSelect'

export function TableView({
  tableView,
}: {
  tableView: SpecificViewConfig<ViewType.Table>
}) {
  const report = useReport()
  const view = useView(ViewType.Table)
  const source = report.getLayer(tableView.tableOptions.layerId)?.source

  return (
    <div className="flex flex-col gap-2 w-full p-4 bg-meepGray-950">
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button className="flex flex-row gap-2 bg-meepGray-800 text-sm text-meepGray-300">
              <Settings2 className="h-4 w-4" /> Configure
            </Button>
          </PopoverTrigger>
          <PopoverContent className="max-w-sm">
            <EditorSelect
              value={tableView.tableOptions.layerId}
              onChange={(layerId) => {
                view.updateView((draft) => {
                  draft.tableOptions.layerId = layerId
                })
              }}
              labelClassName="w-full"
              options={
                report.report.layers.map((l) => ({
                  value: l.id,
                  label: (
                    <CRMSelection
                      source={l.sourceData}
                      displayCount={false}
                      className="truncate"
                    />
                  ),
                })) || []
              }
            />
            <EditorSelect
              iconComponent={LucideBoxSelect}
              // label={'Boundaries'}
              labelClassName="w-auto"
              value={view.currentViewOfType?.tableOptions?.groupBy.area}
              options={Object.values(AnalyticalAreaType).map((boundary) => ({
                value: boundary,
                label: toSpaceCase(boundary),
              }))}
              onChange={(d) => {
                view.updateView((draft) => {
                  draft.tableOptions.groupBy.area = d as AnalyticalAreaType
                })
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      {!!source && <TableDisplay sourceId={source} tableView={tableView} />}
    </div>
  )
}

function TableDisplay({
  sourceId,
  tableView,
}: {
  sourceId: string
  tableView: SpecificViewConfig<ViewType.Table>
}) {
  const report = useReport()
  const explorer = useExplorer()
  const data = useDataByBoundary(sourceId, tableView.tableOptions.groupBy.area)
  const view = useView(ViewType.Table)

  const rows = useMemo(
    () =>
      data.data?.choroplethDataForSource.map((d) => {
        // zip up the columns and the row data
        return d.columns
          ? Object.fromEntries(d.columns.map((col, i) => [col, d.row[i + 1]]))
          : {}
      }) || [],
    [data]
  )

  const columns = useMemo(
    () =>
      data.data?.choroplethDataForSource[0].columns
        ?.filter((h) => {
          // Remove columns
          return ![
            // 'gss',
            // 'label',
            'geography',
            'geography code',
            'geography name',
          ].includes(h)
        })
        .reduce(
          (array, col) => {
            array.push({
              accessorKey: col,
              accessorFn: (row) => row[col],
              header: ({ column }) => {
                return (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                  >
                    {col}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                )
              },
              cell: (row) => (
                <div className="truncate max-w-xs">
                  {String(row.getValue())}
                </div>
              ),
            } satisfies ColumnDef<{ [key: string]: string }>)
            return array
          },
          [
            {
              id: 'groupBy',
              enablePinning: true,
              accessorKey: 'groupBy',
              accessorFn: (row) => row['gss'],
              header: ({ column }) => {
                return (
                  <div
                    className={twMerge(
                      'font-semibold text-md',
                      column.getIsPinned() ? 'w-[200px]' : ''
                    )}
                  >
                    <Button
                      variant="ghost"
                      onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                      }
                    >
                      Area
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )
              },
              cell: ({ row, column }) => (
                // Render the label key with a href to the gss key
                <div
                  className={twMerge(
                    'font-semibold text-md flex flex-row gap-2 items-center justify-start truncate',
                    column.getIsPinned() ? 'w-[250px]' : ''
                  )}
                >
                  {report.isStarred({
                    entity: 'area',
                    id: row.getValue('gss'),
                  }) ? (
                    <Star className="h-4 w-4 text-meepGray-300 shrink-0 grow-0" />
                  ) : undefined}
                  {row.getValue('label')}
                </div>
              ),
            },
          ] as ColumnDef<{ [key: string]: string }>[]
        ) || [],
    [data]
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (newSort) => {
      view.updateView((draft) => {
        const newS =
          typeof newSort === 'function'
            ? newSort(tableView.tableOptions.sorting)
            : newSort
        draft.tableOptions.sorting = newS
      })
    },
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: tableView.tableOptions.sorting,
    },
    initialState: {
      columnPinning: {
        left: ['groupBy'],
      },
      pagination: {
        pageSize: 10,
      },
    },
    // onColumnFiltersChange: setColumnFilters,
    // getSortedRowModel: getSortedRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    // onColumnVisibilityChange: setColumnVisibility,
    // onRowSelectionChange: setRowSelection,
    // state: {
    //   sorting,
    //   columnFilters,
    //   columnVisibility,
    //   rowSelection,
    // },
  })

  return (
    <>
      {!data.loading && !!data.data && (
        <div className="my-4">
          <h1 className="text-hMd">
            {pluralize(
              // area type
              toSpaceCase(tableView.tableOptions.groupBy.area),
              data.data.choroplethDataForSource.length,
              true
            )}
          </h1>
        </div>
      )}
      <div>
        {data.loading ? (
          <div className="h-24 py-24 flex items-center justify-center">
            <LoadingIcon />
          </div>
        ) : (
          <>
            <Table
              style={{
                height: '66%',
              }}
              className="overflow-y-auto"
            >
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          className={
                            header.column.getIsPinned()
                              ? 'sticky left-0 bg-meepGray-950'
                              : ''
                          }
                        >
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
                      data-state={row.getIsSelected() && 'selected'}
                      onClick={() => {
                        explorer.select({
                          entity: 'area',
                          id: row.getValue('gss'),
                          showExplorer: true,
                        })
                      }}
                      className="group hover:bg-meepGray-800 cursor-pointer"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={
                            cell.column.getIsPinned()
                              ? 'sticky left-0 bg-meepGray-950 group-hover:bg-meepGray-800'
                              : ''
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {table.getRowModel().rows?.length ? (
              <div className="px-2 pb-4 pt-2">
                <DataTablePagination table={table} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  )
}

const useDataByBoundary = (
  sourceId: string,
  analyticalAreaType: AnalyticalAreaType
) => {
  return useQuery<
    SourceStatsByBoundaryQuery,
    SourceStatsByBoundaryQueryVariables
  >(CHOROPLETH_STATS_FOR_SOURCE, {
    variables: {
      sourceId: sourceId!,
      analyticalAreaType,
      mode: ChoroplethMode.Table,
    },
    notifyOnNetworkStatusChange: true, // required to mark loading: true on fetchMore()
  })
}
