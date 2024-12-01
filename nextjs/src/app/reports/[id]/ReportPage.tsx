// page.js
'use client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { contentEditableMutation } from '@/lib/html'
import {
  isConstituencyPanelOpenAtom,
  isDataConfigOpenAtom,
  selectedConstituencyAtom,
} from '@/lib/map/state'
import { useAtom } from 'jotai'
import {
  BarChart3,
  Layers,
  MoreVertical,
  RefreshCcw,
  Trash,
} from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { ConstituenciesPanel } from './ConstituenciesPanel'
import DataConfigPanel from './DataConfigPanel'
import { NotFound } from './NotFound'
import { ReportMap } from './ReportMap'
import { ReportContext } from './context'

export function ReportPage() {
  const { report, updateReport, deleteReport, refreshReportDataQueries } =
    useContext(ReportContext)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDataConfigOpen, setDataConfigOpen] = useAtom(isDataConfigOpenAtom)
  const toggleDataConfig = () => setDataConfigOpen((b) => !b)
  const [isConstituencyPanelOpen, setConstituencyPanelOpen] = useAtom(
    isConstituencyPanelOpenAtom
  )
  const [selectedConstituency, setSelectedConstituency] = useAtom(
    selectedConstituencyAtom
  )
  const toggleConsData = () => {
    setConstituencyPanelOpen((b) => {
      if (b) {
        setSelectedConstituency(null)
      }
      return !b
    })
  }

  useEffect(() => {
    // @ts-ignore
    if (!report?.data?.mapReport?.layers?.length) {
      return setConstituencyPanelOpen(false)
    }
  }, [selectedConstituency, report])

  if (!report?.loading && report?.called && !report?.data?.mapReport) {
    return NotFound()
  }

  const toggles = [
    {
      icon: Layers,
      label: 'Map layers',
      enabled: isDataConfigOpen,
      toggle: toggleDataConfig,
    },
    {
      icon: BarChart3,
      label: 'Constituency data',
      enabled: isConstituencyPanelOpen,
      toggle: toggleConsData,
    },
  ]

  return (
    <>
      <div className="absolute w-full h-full flex flex-row pointer-events-none">
        <div className="w-full h-full pointer-events-auto">
          <ReportMap />
        </div>
        {/* Layer card */}
        <aside className="absolute top-0 left-0 p-5 w-[200px] h-full pointer-events-auto">
          <div className="flex flex-col items-start gap-4 max-h-full">
            <Card className="w-[200px] p-3 bg-white border-1 border-meepGray-700 text-meepGray-800">
              <CardHeader className="flex flex-row items-start">
                {report?.loading && !report?.data?.mapReport ? (
                  <CardTitle className="text-hMd grow font-IBMPlexSansMedium">
                    Loading...
                  </CardTitle>
                ) : (
                  <>
                    <CardTitle
                      id="nickname"
                      className="text-hMd grow font-IBMPlexSansMedium"
                      {...contentEditableMutation(
                        updateReport,
                        'name',
                        'Untitled Report'
                      )}
                    >
                      {report?.data?.mapReport.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreVertical className="w-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        {report?.data?.mapReport && (
                          <DropdownMenuItem onClick={refreshReportDataQueries}>
                            <RefreshCcw className="w-4 mr-2" />
                            Refresh
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setDeleteOpen(true)}
                          className="text-red-400"
                        >
                          <Trash className="w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </CardHeader>
              {report?.data?.mapReport && (
                <CardContent className="mt-4 grid grid-cols-1 gap-2">
                  {toggles.map(({ icon: Icon, label, enabled, toggle }) => (
                    <div
                      key={label}
                      className="hover:bg-meepGray-100 px-0 flex flex-row gap-2 items-center overflow-hidden text-nowrap text-ellipsis cursor-pointer"
                      onClick={toggle}
                    >
                      <div
                        className={twMerge(
                          'relative rounded inline-block h-9 w-9',
                          enabled ? 'bg-meepGray-800' : 'bg-meepGray-100'
                        )}
                      >
                        <Icon
                          className={twMerge(
                            'w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                            enabled && 'text-white'
                          )}
                        />
                      </div>
                      {label}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
            {/* Data config card */}
            {report?.data?.mapReport && isDataConfigOpen && <DataConfigPanel />}
          </div>
        </aside>
        {report?.data?.mapReport && isConstituencyPanelOpen && (
          <aside className="absolute top-0 right-0 p-5 w-[400px] h-full">
            <ConstituenciesPanel />
          </aside>
        )}
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={() => setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This action cannot be undone. This will permanently delete this
              report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={buttonVariants({ variant: 'outline' })}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteReport()
              }}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Confirm delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
