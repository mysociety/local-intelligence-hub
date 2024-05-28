// page.js
"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { gql, useApolloClient, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { Provider as JotaiProvider } from "jotai";
import { MapProvider } from "react-map-gl";
import { PublicMap } from "@/components/report/PublicMap";
import { GetPublicMapReportForLayoutQuery, GetPublicMapReportForLayoutQueryVariables } from "@/__generated__/graphql";
import { LoadingIcon } from "@/components/ui/loadingIcon";

type Params = {
  hostname: string
  reportSlug: string
}

export default function Page({ params: { hostname } }: { params: Params }) {
  // const report = useQuery<GetPublicMapReportForLayoutQuery, GetPublicMapReportForLayoutQueryVariables>(GET_PUBLIC_MAP_REPORT, {
  //   variables: { hostname },
  // });

  return (
    <MapProvider>
      <JotaiProvider>
        <div className='h-dvh flex flex-col'>
          <main className="h-full relative overflow-x-hidden overflow-y-hidden flex-grow">
            <div className="absolute w-full h-full flex flex-row pointer-events-none">
              <div className='w-full h-full pointer-events-auto'>
                <PublicMap />
              </div>
              {/* {!report.data ? (
                <div className="absolute w-full h-full inset-0 z-10 pointer-events-none">
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <LoadingIcon />
                  </div>
                </div>
              ) : ( */}
                <aside className="absolute top-5 left-5 right-0 w-0 pointer-events-auto">
                  <div className='w-[250px] rounded-md bg-meepGray-100 text-green-950 p-6'>
                    <h1 className='text-xl font-bold mb-1 leading-tight'>
                      Local climate and nature hustings
                    </h1>
                    <p className='text-sm'>
                      Explore our map of Husting events happening all over the uk or input your postcode to see what’s happening near you. We’ve had over 300+ events so far.
                    </p>
                  </div>
                </aside>
              {/* )} */}
            </div>
          </main>
        </div>
      </JotaiProvider>
    </MapProvider>
  )
}

// const GET_PUBLIC_MAP_REPORT = gql`
//   query GetPublicMapReportForLayout($orgSlug: String!, $reportSlug: String!) {
//     publicMapReport(orgSlug: $orgSlug, reportSlug: $reportSlug) {
//       id
//       name
//       displayOptions
//       organisation {
//         id
//         slug
//         name
//       }
//       layers {
//         id
//         name
//       }
//     }
//   }
// `