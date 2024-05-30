// page.js
"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { gql, useLazyQuery, useQuery } from "@apollo/client";
import { Provider as JotaiProvider } from "jotai";
import { MapProvider } from "react-map-gl";
import { HubMap } from "@/components/hub/HubMap";
import { useState } from "react";
import { format, formatRelative } from "date-fns";
import { ConstituencyView } from "@/components/hub/ConstituencyView";
import { GetLocalDataQuery, GetLocalDataQueryVariables } from "@/__generated__/graphql";
import { SIDEBAR_WIDTH } from "@/components/hub/data";

type Params = {
  hostname: string
}

export default function Page({ params: { hostname } }: { params: Params }) {
  const hub = useQuery(GET_HUB_MAP_DATA, {
    variables: { hostname },
  });

  const [postcode, setPostcode] = useState('')

  // TODO: postcode cahnge
  const [fetchLocalData, localData] = useLazyQuery<GetLocalDataQuery, GetLocalDataQueryVariables>(GET_LOCAL_DATA, {
    variables: { postcode, hostname }
  });

  return (
    <MapProvider>
      <JotaiProvider>
        <div className='h-dvh flex flex-col'>
          <main className="h-full relative overflow-x-hidden overflow-y-hidden flex-grow">
            <div className="absolute w-full h-full flex flex-row pointer-events-none">
              <div className='w-full h-full pointer-events-auto'>
                <HubMap
                  externalDataSources={hub.data?.hubByHostname?.layers?.map((i: any) => i.id) || []}
                  currentConstituency={localData.data?.postcodeSearch.constituency}  
                />
              </div>
              <aside className="absolute top-5 left-5 right-0 w-0 pointer-events-auto">
                <div className='max-w-[100vw] rounded-md bg-meepGray-100 text-green-950 p-6' style={{
                  width: SIDEBAR_WIDTH
                }}>
                  <h1 className='text-2xl font-bold mb-1 leading-tight'>
                    Find out how you can support the climate and nature
                  </h1>
                  <p className='text-sm text-meepGray-500'>
                    Explore our map of Husting events happening all over the uk or input your postcode to see what{"’"}s happening near you. We{"’"}ve had over 300+ events so far.
                  </p>
                  <input
                    type="text"
                    placeholder="Enter your postcode"
                    className='p-4 text-lg w-full rounded-md border border-meepGray-300 mt-4 active:border-green-500'
                    value={postcode}
                    onChange={e => setPostcode(e.target.value)}
                  />
                  <button
                    className='bg-green-500 text-white text-lg font-bold rounded-md w-full p-4 mt-4'
                    disabled={!postcode || (localData.loading && !localData.error)}
                    onClick={() => fetchLocalData()}
                  >
                    {localData.loading ? 'Loading...' : 'Search'}
                  </button>
                  {localData.data && (
                    <ConstituencyView data={localData.data} />
                  )}
                </div>
              </aside>
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

const GET_LOCAL_DATA = gql`
  query GetLocalData($postcode: String!, $hostname: String!) {
    postcodeSearch(postcode: $postcode) {
      constituency {
        id
        gss
        name
        # For zooming
        fitBounds
        # List of events
        genericDataForHub(hostname: $hostname) {
          id
          title
          address
          postcode
          startTime
          publicUrl
          description
          dataType {
            id
            dataSet {
              externalDataSource {
                dataType
              }
            }
          }
        }
      }
    }
  }
`