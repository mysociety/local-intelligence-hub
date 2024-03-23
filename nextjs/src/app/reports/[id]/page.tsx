// page.js
"use client";

import { useContext, useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BarChart3, Layers, MoreVertical } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import DataConfigPanel from "@/components/dataConfig";
import { FetchResult, gql, useApolloClient, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { DeleteMapReportMutation, DeleteMapReportMutationVariables, GetMapReportQuery, GetMapReportQueryVariables, MapReportInput, MapReportLayerAnalyticsQuery, MapReportLayerAnalyticsQueryVariables, UpdateMapReportMutation, UpdateMapReportMutationVariables } from "@/__generated__/graphql";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import spaceCase from 'to-space-case'
import { toastPromise } from "@/lib/toast";
import { MAP_REPORT_LAYER_ANALYTICS, ReportMap, selectedConstituencyAtom } from "@/components/report/ReportMap";
import { MAP_REPORT_FRAGMENT, isConstituencyPanelOpenAtom, isDataConfigOpenAtom } from "./lib";
import { ReportContext } from "./context";
import { LoadingIcon } from "@/components/ui/loadingIcon";
import { Provider as JotaiProvider, atom, useAtom } from "jotai";
import { ConstituenciesPanel } from "./ConstituenciesPanel";
import { MapProvider } from "react-map-gl";
import { twMerge } from "tailwind-merge";

type Params = {
  id: string
}

export default function Page({ params: { id } }: { params: Params }) {
  const client = useApolloClient();
  const router = useRouter();
  const report = useQuery<GetMapReportQuery, GetMapReportQueryVariables>(GET_MAP_REPORT, {
    variables: { id },
  });

  return (
    <MapProvider>
      <JotaiProvider key={id}>
        <ReportContext.Provider value={{ 
          id,
          report,
          updateReport: updateMutation,
          deleteReport: del
        }}>
          <ReportPage />
        </ReportContext.Provider>
      </JotaiProvider>
    </MapProvider>
  )

  function refreshStatistics () {
    toastPromise(
      client.refetchQueries({
        include: [
          // Queries that involve member data
          "MapReportLayerAnalytics",
          "GetConstituencyData"
        ],
      }),
      {
        loading: "Refreshing statistics...",
        success: "Statistics updated",
        error: `Couldn't update statistics`,
      }
    )
  }

  function updateMutation (input: MapReportInput) {
    const update = client.mutate<UpdateMapReportMutation, UpdateMapReportMutationVariables>({
      mutation: UPDATE_MAP_REPORT,
      variables: {
        input: {
          id,
          ...input
        }
      }
    })
    toastPromise(update, {
      loading: "Saving...",
      success: (d) => {
        if (!d.errors && d.data) {
          if (input.layers?.length) {
            // If layers changed, that means
            // all the member numbers will have changed too.
            refreshStatistics()
          }
          return {
            title: "Report saved",
            description: `Updated ${Object.keys(input).map(spaceCase).join(", ")}`
          }
        } else {
          throw new Error("Couldn't save report")
        }
      },
      error: `Couldn't save report`,
    });
  }

  function del () {
    const deleteMutation = client.mutate<DeleteMapReportMutation, DeleteMapReportMutationVariables>({
      mutation: DELETE_MAP_REPORT,
      variables: {
        id: { id }
      }
    })
    toast.promise(deleteMutation, {
      loading: "Deleting...",
      success: (d: FetchResult) => {
        if (!d.errors && d.data) {
          router.push("/reports");
          return "Deleted report";
        }
      },
      error: `Couldn't delete report`,
    });
  }
}

function ReportPage() {
  const { report, updateReport, deleteReport } = useContext(ReportContext);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDataConfigOpen, setDataConfigOpen] = useAtom(isDataConfigOpenAtom);
  const toggleDataConfig = () => setDataConfigOpen(b => !b);
  const [isConstituencyPanelOpen, setConstituencyPanelOpen] = useAtom(isConstituencyPanelOpenAtom);
  const [selectedConstituency, setSelectedConstituency] = useAtom(selectedConstituencyAtom);
  const toggleConsData = () => {
    setConstituencyPanelOpen(b => {
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
    return (
      <main className="absolute w-full h-full">
        <div className="flex flex-col items-center justify-center w-full h-full">
          <Card className="p-4 bg-white border-1 border-meepGray-700 text-meepGray-800">
            <CardHeader>
              <CardTitle className="text-hMd grow font-IBMPlexSansMedium">
                Report not found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                The report you are looking for does not exist.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  const toggles = [
    {
      icon: Layers,
      label: "Map layers",
      enabled: isDataConfigOpen,
      toggle: toggleDataConfig
    },
    {
      icon: BarChart3,
      label: "Constituency data",
      enabled: isConstituencyPanelOpen,
      toggle: toggleConsData
    }
  ]

  return (
    <>
      <main className="absolute w-full h-full flex flex-row pointer-events-none">
        <div className='w-full h-full pointer-events-auto'>
          <ReportMap />
        </div>
        {report?.loading && !report?.data?.mapReport && (
          <div className="absolute w-full h-full inset-0">
            <div className="flex flex-col items-center justify-center w-full h-full">
              <LoadingIcon />
            </div>
          </div>
        )}
        {/* Layer card */}
        <aside className="absolute top-5 left-5 right-0 w-0 pointer-events-auto">
          <div className="flex flex-col items-start gap-4">
            <Card className="w-[200px] p-3 bg-white border-1 border-meepGray-700 text-meepGray-800">
              <CardHeader className="flex flex-row items-center mb-4">
                {report?.loading && !report?.data?.mapReport ? (
                  <CardTitle className="text-hMd grow font-IBMPlexSansMedium">
                    Loading...
                  </CardTitle>
                ) : (
                  <>
                    <CardTitle
                      contentEditable id="nickname"
                      className="text-hMd grow font-IBMPlexSansMedium"
                      onBlur={d => {
                        updateReport({
                          name: document.getElementById("nickname")?.textContent?.trim()
                        })
                      }}
                    >
                      {report?.data?.mapReport.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <MoreVertical className='w-3' />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem onClick={() => setDeleteOpen(true)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </CardHeader>
            {report?.data?.mapReport && (
              <CardContent className='grid grid-cols-1 gap-2'>
                {toggles.map(({ icon: Icon, label, enabled, toggle }) => (
                  <div
                    key={label}
                    className='hover:bg-meepGray-100 px-0 flex flex-row gap-2 items-center overflow-hidden text-nowrap text-ellipsis cursor-pointer'
                    onClick={toggle}>
                    <div className={twMerge(
                      'relative rounded inline-block h-9 w-9',
                      enabled ? "bg-meepGray-800" : "bg-meepGray-100"
                    )}>
                      <Icon className={twMerge(
                        "w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", 
                        enabled && "text-white"
                      )} />
                    </div>
                    {label}
                  </div>
                ))}
              </CardContent>
            )}
            </Card>
            {/* Data config card */}
            {report?.data?.mapReport && isDataConfigOpen && (
              <DataConfigPanel />
            )}
          </div>
        </aside>
        {report?.data?.mapReport && isConstituencyPanelOpen && (
          <aside className="absolute top-0 right-0 p-5 w-[400px] h-full">
            <ConstituenciesPanel />
          </aside>
        )}
      </main>
      <AlertDialog open={deleteOpen} onOpenChange={() => setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This action cannot be undone. This will permanently delete
              this report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={buttonVariants({ variant: "outline" })}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteReport();
              }}
              className={buttonVariants({ variant: "destructive" })}
            >
              Confirm delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const GET_MAP_REPORT = gql`
  query GetMapReport($id: ID!) {
    mapReport(pk: $id) {
      id
      name
      ... MapReportPage
    }
  }
  ${MAP_REPORT_FRAGMENT}
`

// Keep this fragment trim
// so that updates return fast
const UPDATE_MAP_REPORT = gql`
  mutation UpdateMapReport($input: MapReportInput!) {
    updateMapReport(data: $input) {
      id
      name
      layers {
        name
        source {
          id
          name
        }
      }
    }
  }
`

const DELETE_MAP_REPORT = gql`
  mutation DeleteMapReport($id: IDObject!) {
    deleteMapReport(data: $id) {
      id
    }
  }
`