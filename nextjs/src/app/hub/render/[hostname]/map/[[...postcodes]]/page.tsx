// page.js
"use client";

import React from 'react'

import "mapbox-gl/dist/mapbox-gl.css";
import { gql, useQuery } from "@apollo/client";
import { Provider as JotaiProvider } from "jotai";
import { MapProvider } from "react-map-gl";
import { HubMap } from "@/components/hub/HubMap";
import { ConstituencyView } from "@/components/hub/ConstituencyView";
import { GetLocalDataQuery, GetLocalDataQueryVariables } from "@/__generated__/graphql";
import { SIDEBAR_WIDTH } from "@/components/hub/data";
import { usePathname, useParams } from 'next/navigation' 
import { SearchPanel } from './SearchPanel';
import Root from '@/data/puck/config/root';
import { useBreakpoint } from '@/hooks/css';


type Params = {
  hostname: string
  postcodes?: string[]
}

export default function Page({ params: { hostname, postcodes } }: { params: Params }) {
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

  const shouldDisplayMap = useBreakpoint("md")

  const localData = useQuery<GetLocalDataQuery, GetLocalDataQueryVariables>(GET_LOCAL_DATA, {
    variables: { postcode: postcodeFromPathname, hostname, shouldDisplayMap },
    skip: !postcodeFromPathname
  });

  return (
    <Root fullScreen={shouldDisplayMap}>
      <MapProvider>
        <JotaiProvider>
          {shouldDisplayMap ? (
            <div className="flex flex-col" style={{ height: "calc(100dvh - 80px" }}>
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
                      localDataLoading={localData.loading}
                    />
                  </div>
                  {!localData.loading && (
                    <aside
                      className="absolute top-0 md:top-[80px] left-0 sm:left-5 right-0 max-w-full pointer-events-auto h-full md:h-[calc(100% - 120px)] max-h-full overflow-y-hidden shadow-hub-muted"
                      style={{ width: SIDEBAR_WIDTH }}
                    >
                      <div className="max-w-[100vw] rounded-[20px] bg-white max-h-full overflow-y-auto">
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
                  )}
                </div>
              </main>
            </div>
          ) : (
            <div className='bg-white rounded-[20px] mt-4 mb-16'>
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
          )}
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
  query GetLocalData($postcode: String!, $hostname: String!, $shouldDisplayMap: Boolean!) {
    postcodeSearch(postcode: $postcode) {
      postcode
      constituency: constituency2024 {
        id
        gss
        name
        # For zooming
        fitBounds @include(if: $shouldDisplayMap)
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
        # PPCs
        ppcs: people(filters:{personType:"PPC"}) {
          id
          name
          photo {
            url
          }
          party: personDatum(filters:{
            dataType_Name: "party"
          }) {
            name: data
            shade
          }
          email: personDatum(filters:{
            dataType_Name: "email"
          }) {
            data
          }
        }
      }
    }
  }
`