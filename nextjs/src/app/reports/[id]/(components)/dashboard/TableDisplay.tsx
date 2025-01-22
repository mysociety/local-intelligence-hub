import {
  ColumnDef,
  Table as TableType,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import { useExplorer } from '@/lib/map'
import { allKeysFromAllData } from '@/lib/utils'
import { useMemo } from 'react'

export function TableDisplay({
  data,
  config,
  title,
  areaName,
}: {
  data: any[]
  config: {
    columns?: string[]
  }
  title: string
  areaName: string
}) {
  const cols: string[] = useMemo(() => {
    const columns = config?.columns || allKeysFromAllData(data)
    return columns
  }, [config, data])

  const dataTableColumns = useMemo(() => {
    if (cols.length === 0) {
      const firstItem = data[0]
      if (firstItem) {
        return Object.keys(firstItem).map(
          (col) =>
            ({
              header: col,
              accessorKey: col,
            }) satisfies ColumnDef<any>
        )
      }
    }
    return cols.map(
      (col) =>
        ({
          header: col,
          accessorKey: col,
        }) satisfies ColumnDef<any>
    )
  }, [cols, data])

  const table = useReactTable({
    data: data,
    columns: dataTableColumns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      {data.length > 0 && (
        <Dialog>
          <DialogTrigger className="w-full mt-2">
            <Button className="w-full h-60 overflow-hidden items-start bg-meepGray-800 hover:bg-meepGray-700 relative text-left">
              <TableComponent table={table} />
              <div className="w-full h-full absolute top-0 left-0 bg-gradient-to-b from-transparent to-meepGray-800 items-center justify-center flex">
                <p className="bg-meepGray-600 p-2 rounded-full font-mono text-sm hover:bg-meepGray-500">
                  Open full table
                </p>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] w-[96vw] max-w-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex gap-4 items-end">
                {areaName}
                <div className="text-meepGray-400">
                  <span className="text-meepGray-400 font-mono text-sm uppercase">
                    Data Source:
                    <span className="text-meepGray-200 ">
                      {title} ({data.length} rows)
                    </span>
                  </span>
                </div>
              </DialogTitle>
              <DialogDescription>
                <TableComponent table={table} />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

interface DataTableProps<TData> {
  table: TableType<TData>
}

function TableComponent<TData>({ table }: DataTableProps<TData>) {
  const explorer = useExplorer()

  const handleRowClick = (id: any) => {
    explorer.select(
      {
        entity: 'record',
        id: String(id),
        showExplorer: true,
      },
      {
        bringIntoView: true,
      }
    )
  }

  return (
    <Table>
      <TableHeader className="text-meepGray-400 font-mono uppercase">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className="text-meepGray-400 font-mono">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              onClick={(d) => handleRowClick(row.id)}
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
            <TableCell
              colSpan={table.getAllColumns().length}
              className="h-24 text-center"
            >
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
