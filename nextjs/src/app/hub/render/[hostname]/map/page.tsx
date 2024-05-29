// page.js
"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { gql, useQuery } from "@apollo/client";
import { Provider as JotaiProvider } from "jotai";
import { MapProvider } from "react-map-gl";
import { HubMap } from "@/components/hub/HubMap";

type Params = {
  hostname: string
}

export default function Page({ params: { hostname } }: { params: Params }) {
  const hub = useQuery(GET_HUB_MAP_DATA, {
    variables: { hostname },
  });

  return (
    <MapProvider>
      <JotaiProvider>
        <div className='h-dvh flex flex-col'>
          <main className="h-full relative overflow-x-hidden overflow-y-hidden flex-grow">
            <div className="absolute w-full h-full flex flex-row pointer-events-none">
              <div className='w-full h-full pointer-events-auto'>
                <HubMap externalDataSources={hub.data?.hubByHostname?.layers?.map((i: any) => i.id) || []} />
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

const GET_HUB_MAP_DATA = gql`
  query GetHubMapData($hostname: String!) {
    hubByHostname(hostname: $hostname) {
      id
      organisation {
        id
        slug
        name
      }
      layers {
        id
        name
        visible
        source {
          id
        }
      }
    }
  }
`