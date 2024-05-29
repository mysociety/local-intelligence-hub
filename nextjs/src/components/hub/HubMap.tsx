"use client"

import Map, { ViewState } from "react-map-gl";
import { atom, useAtom } from "jotai";
import { authenticationHeaders } from "@/lib/auth";
import { ImmutableLike } from "react-map-gl/dist/esm/types";
import { PlaceholderLayer, useLoadedMap, useMapIcons } from "@/lib/map";
import { HubPointMarkers } from "./HubMapPoints";
import { LoadingIcon } from "../ui/loadingIcon";

const viewStateAtom = atom<Partial<ViewState>>({
  longitude: -2.296605,
  latitude: 53.593349,
  zoom: 6
})

export function HubMap ({
  mapStyle,
  externalDataSources
}: {
  mapStyle?: string | mapboxgl.Style | ImmutableLike<mapboxgl.Style> | undefined,
  externalDataSources: string[]
}) {
  const [viewState, setViewState] = useAtom(viewStateAtom)

  const requiredImages = [
    {
      url: () => new URL('/markers/tcc-event-marker.png', window.location.href).toString(),
      name: 'tcc-event-marker'
    },
    {
      url: () => new URL('/markers/default.png', window.location.href).toString(),
      name: 'meep-marker-0'
    }
  ]

  const mapbox = useLoadedMap()

  const loadedImages = useMapIcons(requiredImages, mapbox)

  return (
    <>
      {!externalDataSources.length || loadedImages.length !== requiredImages.length && (
        <div className="absolute w-full h-full inset-0 z-10 pointer-events-none">
          <div className="flex flex-col items-center justify-center w-full h-full">
            <LoadingIcon />
          </div>
        </div>
      )}
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapStyle={mapStyle || "mapbox://styles/commonknowledge/clwqeu7rb012301nyh52n3kss/draft"}
        transformRequest={(url, resourceType) => {
          if (
            url.includes(process.env.NEXT_PUBLIC_BACKEND_BASE_URL!) &&
            !url.includes("tiles.json")
          ) {
            return {
              url,
              headers: authenticationHeaders(),
              method: "GET",
            };
          }
          return { url };
        }}
      >
        <PlaceholderLayer id={"PLACEHOLDER_MARKERS"} />
        {loadedImages.some(t => t === "tcc-event-marker") && externalDataSources.map(
          (externalDataSourceId, index) => (
            <HubPointMarkers
              key={externalDataSourceId}
              externalDataSourceId={externalDataSourceId}
              index={index}
            />
          )
        )}
      </Map>
    </>
  );
}