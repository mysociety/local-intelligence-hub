// page.js
"use client";

import React from 'react'

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
import { useRouter } from 'next/navigation';
import { usePathname, useParams } from 'next/navigation' 
import { SearchPanel } from './SearchPanel';
import Root from '@/data/puck/config/root';


type Params = {
  hostname: string
  postcodes?: string[]
}

export default function Page({ params: { hostname, postcodes } }: { params: Params }) {
  const router = useRouter()

  const hub = useQuery(GET_HUB_MAP_DATA, {
    variables: { hostname },
  });

  // To listen for any soft changes to the pathname
  // and extract a postcode
  // e.g. /map/postcode/E15QJ
  const pathname = usePathname()
  const pathnameSegments = pathname.split("/")
  const postcodeFromPathname = (
      pathnameSegments &&
      pathnameSegments.length === 4 &&
      pathnameSegments[2] === 'postcode'
    ) ? pathnameSegments[3].replace(/([\s ]*)/mig, "").trim() : ''

  const localData = useQuery<GetLocalDataQuery, GetLocalDataQueryVariables>(GET_LOCAL_DATA, {
    variables: { postcode: postcodeFromPathname, hostname },
    skip: !postcodeFromPathname
  });

  return (
    <Root>
      <MapProvider>
        <JotaiProvider>
          <div className="h-dvh flex flex-col">
            <main className="h-full relative overflow-x-hidden overflow-y-hidden flex-grow">
              <div className="absolute w-full h-full flex flex-row pointer-events-none">
                <div className="w-full h-full pointer-events-auto">
                  <HubMap
                    externalDataSources={
                      hub.data?.hubByHostname?.layers?.map((i: any) => i.id) ||
                      []
                    }
                    currentConstituency={
                      localData.data?.postcodeSearch.constituency
                    }
                  />
                </div>
                <aside className="absolute top-[80px] left-5 right-0 w-0 pointer-events-auto">
                  <div
                    className="max-w-[100vw] rounded-[20px] bg-white  p-6"
                    style={{
                      width: SIDEBAR_WIDTH,
                    }}
                  >
                    {!localData.data ? (
                      <SearchPanel
                        onSearch={(postcode) => {
                          window.history.pushState(
                            null,
                            "",
                            `/map/postcode/${postcode}`
                          );
                        }}
                        isLoading={localData.loading}
                      />
                    ) : (
                      <ConstituencyView data={localData.data} />
                    )}
                  </div>
                </aside>
              </div>
              <aside
                className="absolute right-0 w-0 pointer-events-auto"
                style={{
                  top: 155,
                  left: 32,
                }}
              >
                <div
                  className="max-w-[100vw] rounded-[20px] bg-jungle-green-bg text-jungle-green-700 p-6"
                  style={{
                    width: SIDEBAR_WIDTH,
                  }}
                >
                  {!localData.data ? (
                    <SearchPanel
                      onSearch={(postcode) => {
                        window.history.pushState(
                          null,
                          "",
                          `/map/postcode/${postcode}`
                        );
                      }}
                      isLoading={localData.loading}
                    />
                  ) : (
                    <ConstituencyView data={localData.data} />
                  )}
                </div>
              </aside>
            </main>
          </div>
        </JotaiProvider>
      </MapProvider>
    </Root>
  );
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
      postcode
      constituency: constituency2024 {
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