// page.js
"use client";

import { useEffect, useState } from "react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import DataConfigPanel from "@/components/dataConfig";
import { FetchResult, gql, useApolloClient, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { DeleteMapReportMutation, DeleteMapReportMutationVariables, GetMapReportQuery, GetMapReportQueryVariables, MapReportInput, UpdateMapReportMutation, UpdateMapReportMutationVariables } from "@/__generated__/graphql";
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
import { ReportMap, selectedConstituencyAtom } from "@/components/report/ReportMap";
import { MAP_REPORT_FRAGMENT } from "./lib";
import { ReportContext } from "./context";
import { LoadingIcon } from "@/components/ui/loadingIcon";
import { Provider as JotaiProvider, useAtom } from "jotai";
import { atomEffect } from 'jotai-effect'
import { ConstituenciesPanel } from "./ConstituenciesPanel";

type Params = {
  id: string
}

export default function Page({ params: { id } }: { params: Params }) {
  const client = useApolloClient();
  const report = useQuery<GetMapReportQuery, GetMapReportQueryVariables>(GET_MAP_REPORT, {
    variables: { id },
  });
  const router = useRouter();

  const [isDataConfigOpen, setDataConfigOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const toggleDataConfig = () => setDataConfigOpen(!isDataConfigOpen);

  const [isConsDataOpen, setConsDataOpen] = useState(false);
  const toggleConsData = () => setConsDataOpen(c => !c);

  atomEffect((get, set) => {
    const selectedConstituency = get(selectedConstituencyAtom)
    setConsDataOpen(!!selectedConstituency)
  })

  if (!report.loading && report.called && !report.data?.mapReport) {
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

  return (
    <JotaiProvider key={id}>
      <ReportContext.Provider value={{ 
        id,
        update: updateMutation
      }}>
        <main className="absolute w-full h-full">
          <div className='w-full h-full'>
            <ReportMap />
          </div>
          {report.loading && !report.data?.mapReport && (
            <div className="absolute w-full h-full inset-0">
              <div className="flex flex-col items-center justify-center w-full h-full">
                <LoadingIcon />
              </div>
            </div>
          )}
          {/* Layer card */}
          <aside className="absolute top-5 left-5 right-0 w-0">
            <div className="flex flex-col items-start gap-4">
              <Card className="w-[200px] p-4 bg-white border-1 border-meepGray-700 text-meepGray-800">
                <CardHeader className="flex flex-row items-center mb-4">
                  {report.loading && !report.data?.mapReport ? (
                    <CardTitle className="text-hMd grow font-IBMPlexSansMedium">
                      Loading...
                    </CardTitle>
                  ) : (
                    <CardTitle
                      contentEditable id="nickname"
                      className="text-hMd grow font-IBMPlexSansMedium"
                      onBlur={d => {
                        updateMutation({
                          name: document.getElementById("nickname")?.textContent?.trim()
                        })
                      }}
                    >
                      {report.data?.mapReport.name}
                    </CardTitle>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreVertical className='w-3' />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuLabel>Report Settings</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Share</DropdownMenuItem>
                      <DropdownMenuItem>Invite</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDeleteOpen(true)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <ToggleGroup type="multiple" variant="outline">
                    {/* @ts-ignore */}
                    <ToggleGroupItem value="a" type="outline" className="p-3 flex gap-2" onClick={toggleDataConfig}>
                      <Layers className="w-4" /> Data Configuration
                    </ToggleGroupItem>
                    {/* @ts-ignore */}
                    <ToggleGroupItem value="b" type="outline" className="p-3 flex gap-2" onClick={toggleConsData}>
                      <BarChart3 className="w-4" /> Constituency Data
                    </ToggleGroupItem>
                  </ToggleGroup>
                </CardContent>
              </Card>
              {/* Data config card */}
              {isDataConfigOpen && (
                <DataConfigPanel />
              )}
            </div>
          </aside>
          <aside className="absolute top-5 right-5 w-[330px]">
            {/* Constituency card */}
            {isConsDataOpen && (
              <ConstituenciesPanel />
            )}
          </aside>
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
                  del();
                }}
                className={buttonVariants({ variant: "destructive" })}
              >
                Confirm delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ReportContext.Provider>
    </JotaiProvider>
  );

  function refreshStatistics () {
    toastPromise(report.refetch(),
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
          if (input.layers) {
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