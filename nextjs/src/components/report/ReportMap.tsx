"use client"

import {
  MapReportConstituencyStatsQuery,
  MapReportConstituencyStatsQueryVariables,
  MapReportLayerAnalyticsQuery,
  MapReportLayerAnalyticsQueryVariables,
  MapReportLayerGeoJsonPointQuery,
  MapReportLayerGeoJsonPointQueryVariables,
  MapReportRegionStatsQuery,
  MapReportRegionStatsQueryVariables,
  MapReportWardStatsQuery,
  MapReportWardStatsQueryVariables,
} from "@/__generated__/graphql";
import { Fragment, useContext, useEffect, useState } from "react";
import Map, { Layer, Source, LayerProps, Popup, ViewState, MapboxGeoJSONFeature } from "react-map-gl";
import { gql, useQuery } from "@apollo/client";
import { ReportContext } from "@/app/reports/[id]/context";
import { LoadingIcon } from "@/components/ui/loadingIcon";
import { scaleLinear, scaleSequential } from 'd3-scale'
import { interpolateInferno } from 'd3-scale-chromatic'
import { Point } from "geojson"
import { atom, useAtom } from "jotai";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { z } from "zod";
import { layerColour, useLoadedMap, isConstituencyPanelOpenAtom } from "@/app/reports/[id]/lib";
import { constituencyPanelTabAtom } from "@/app/reports/[id]/ConstituenciesPanel";
import { authenticationHeaders } from "@/lib/auth";

const MAX_REGION_ZOOM = 8
export const MAX_CONSTITUENCY_ZOOM = 10
const MIN_MEMBERS_ZOOM = 12.5

const viewStateAtom = atom<Partial<ViewState>>({
  longitude: -2.296605,
  latitude: 53.593349,
  zoom: 6
})
const loadingLayersAtom = atom<{[layerKey:string]: boolean}>({});

const selectedSourceMarkerAtom = atom<MapboxGeoJSONFeature | null>(null)

export const selectedConstituencyAtom = atom<string | null>(null)

export function ReportMap () {
  const { id, displayOptions } = useContext(ReportContext)
  const analytics = useQuery<MapReportLayerAnalyticsQuery, MapReportLayerAnalyticsQueryVariables>(MAP_REPORT_LAYER_ANALYTICS, {
    variables: {
      reportID: id,
    }
  })

  const regionAnalytics = useQuery<MapReportRegionStatsQuery, MapReportRegionStatsQueryVariables>(MAP_REPORT_REGION_STATS, {
    variables: {
      reportID: id,
    }
  })

  const constituencyAnalytics = useQuery<MapReportConstituencyStatsQuery, MapReportConstituencyStatsQueryVariables>(MAP_REPORT_CONSTITUENCY_STATS, {
    variables: {
      reportID: id,
    }
  })

  const wardAnalytics = useQuery<MapReportWardStatsQuery, MapReportWardStatsQueryVariables>(MAP_REPORT_WARD_STATS, {
    variables: {
      reportID: id,
    }
  })

  const mapbox = useLoadedMap()

  useEffect(() => {
    console.log("Map", mapbox.loadedMap)
  }, [mapbox.loadedMap])

  const TILESETS: Record<"EERs" | "constituencies" | "wards", {
    name: string,
    singular: string,
    mapboxSourceId: string,
    sourceLayerId?: string,
    promoteId: string,
    labelId: string,
    mapboxSourceProps?: { maxzoom?: number },
    mapboxLayerProps?: Omit<LayerProps, 'type' | 'url' | 'id' | 'paint' | 'layout'>,
    data: MapReportRegionStatsQuery['mapReport']['importedDataCountByRegion'],
    downloadUrl?: string
  }> = {
    EERs: {
      name: "regions",
      singular: "region",
      mapboxSourceId: "commonknowledge.awsfhx20",
      downloadUrl: "https://ckan.publishing.service.gov.uk/dataset/european-electoral-regions-december-2018-boundaries-uk-buc1/resource/b268c97f-2507-4477-9149-0a0c5d2bfbca",
      sourceLayerId: "European_Electoral_Regions_De-bxyqod",
      promoteId: "eer18cd",
      labelId: "eer18nm",
      data: regionAnalytics.data?.mapReport.importedDataCountByRegion || [],
      mapboxSourceProps: {
      //   maxzoom: MAX_REGION_ZOOM
      },
      mapboxLayerProps: {
        maxzoom: MAX_REGION_ZOOM
      }
    },
    constituencies: {
      name: "GE2019 constituencies",
      singular: "constituency",
      mapboxSourceId: "commonknowledge.4xqg91lc",
      sourceLayerId: "Westminster_Parliamentary_Con-6i1rlq",
      promoteId: "pcon16cd",
      labelId: "pcon16nm",
      data: constituencyAnalytics.data?.mapReport.importedDataCountByConstituency || [],
      mapboxSourceProps: {},
      mapboxLayerProps: {
        minzoom: MAX_REGION_ZOOM,
        maxzoom: MAX_CONSTITUENCY_ZOOM,
      }
    },
    wards: {
      name: "wards",
      singular: "ward",
      mapboxSourceId: "commonknowledge.0rzbo365",
      sourceLayerId: "Wards_Dec_2023_UK_Boundaries_-7wzb6g",
      promoteId: "WD23CD",
      labelId: "WD23NM",
      data: wardAnalytics.data?.mapReport.importedDataCountByWard || [],
      mapboxSourceProps: {},
      mapboxLayerProps: {
        minzoom: MAX_CONSTITUENCY_ZOOM,
      }
    }
  }

  function addChloroplethDataToMapbox(
    gss: string,
    count: number,
    mapboxSourceId: string,
    sourceLayerId: string,
  ) {
    mapbox.loadedMap?.setFeatureState({
      source: mapboxSourceId,
      sourceLayer: sourceLayerId,
      id: gss,
    }, {
      count: count
    })
  }

  useEffect(function setFeatureState() {
    if (!mapbox.loadedMap) return
    if (!analytics.data) return
    Object.values(TILESETS)?.forEach((tileset) => {
      tileset.data?.forEach((area) => {
        if (area?.gss && area?.count && tileset.sourceLayerId) {
          try {
            addChloroplethDataToMapbox(area.gss, area.count, tileset.mapboxSourceId, tileset.sourceLayerId)
          } catch {
            mapbox.loadedMap?.on('load', () => {
              addChloroplethDataToMapbox(area.gss!, area.count, tileset.mapboxSourceId, tileset.sourceLayerId!) 
            })
          }
        }
      })
    })
  }, [analytics, TILESETS, mapbox.loadedMap])

  const requiredImages = [
    {
      url: () => new URL('/markers/default.png', window.location.href).toString(),
      name: 'meep-marker-0'
    },
    {
      url: () => new URL('/markers/default-2.png', window.location.href).toString(),
      name: 'meep-marker-1'
    },
    {
      url: () => new URL('/markers/selected.png', window.location.href).toString(),
      name: 'meep-marker-selected'
    },
  ]

  const [loadedImages, setLoadedImages] = useState<string[]>([])

  useEffect(function loadIcons() {
    if (!mapbox.loadedMap) return
    requiredImages.forEach((requiredImage) => {
      console.log("Loading", requiredImage.url())
      // Load an image from an external URL.
      mapbox.loadedMap!.loadImage(
        requiredImage.url(),
        (error, image) => {
          try {
            if (error) throw error;
            if (!image) throw new Error('Marker icon did not load')
            mapbox.loadedMap!.addImage(requiredImage.name, image);
            setLoadedImages(loadedImages => [...loadedImages, requiredImage.name])
          } catch (e) {
            console.error("Failed to load image", e)
          }
        }
      )
    })
  }, [mapbox.loadedMap, setLoadedImages])

  const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(selectedSourceMarkerAtom)
  const [selectedConstituency, setSelectedConstituency] = useAtom(selectedConstituencyAtom)
  const [tab, setTab] = useAtom(constituencyPanelTabAtom)
  // const isConstituencyPanelOpenAtom
  const [isConstituencyPanelOpen, setIsConstituencyPanelOpen] = useAtom(isConstituencyPanelOpenAtom)

  useEffect(function selectConstituency() {
    mapbox.loadedMap?.on('mouseover', `${TILESETS.constituencies.mapboxSourceId}-fill`, () => {
      const canvas = mapbox.loadedMap?.getCanvas()
      if (!canvas) return
      canvas.style.cursor = 'pointer'
    })
    mapbox.loadedMap?.on('mouseleave', `${TILESETS.constituencies.mapboxSourceId}-fill`, () => {
      const canvas = mapbox.loadedMap?.getCanvas()
      if (!canvas) return
      canvas.style.cursor = ''
    })
    mapbox.loadedMap?.on('click', `${TILESETS.constituencies.mapboxSourceId}-fill`, event => {
      try {
        const feature = event.features?.[0]
        if (feature) {
          if (feature.source === TILESETS.constituencies.mapboxSourceId) {
            const id = feature.properties?.[TILESETS.constituencies.promoteId]
            if (id) {
              setSelectedConstituency(id)
              setIsConstituencyPanelOpen(true)
              setTab("selected")
            }
          }
        }
      } catch (e) {
        console.error("Failed to select constituency", e)
      }
    })
  }, [mapbox.loadedMap])

  const [viewState, setViewState] = useAtom(viewStateAtom)
  const [loadingLayers] = useAtom(loadingLayersAtom)

  const { data: selectedPointData, loading: selectedPointLoading } = useQuery<
    MapReportLayerGeoJsonPointQuery,
    MapReportLayerGeoJsonPointQueryVariables
  >(MAP_REPORT_LAYER_POINT, {
    skip: !selectedSourceMarker?.properties?.id,
    variables: {
      genericDataId: String(selectedSourceMarker?.properties?.id),
    },
  });

  const loading = analytics.loading || Object.values(loadingLayers).includes(true)

  return (
    <>
      {(analytics.loading || loading) ? (
        <div className="absolute w-full h-full inset-0 z-10 pointer-events-none">
          <div className="flex flex-col items-center justify-center w-full h-full">
            <LoadingIcon />
          </div>
        </div>
      ) : null}
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        mapStyle={displayOptions.showStreetDetails
          ? "mapbox://styles/commonknowledge/clubx087l014y01mj1bv63yg8"
          : "mapbox://styles/commonknowledge/clty3prwh004601pr4nqn7l9s"}
        onClick={() => setSelectedSourceMarker(null)}
        // transformRequest={(url, resourceType) => {
        //   if (url.indexOf(process.env.NEXT_PUBLIC_BACKEND_BASE_URL!) > -1) {
        //       const obj = {
        //           url,
        //           headers: authenticationHeaders(),
        //           credentials: 'include'  // Include cookies for cross-origin requests
        //       }
        //       console.log("Auth'd mapbox request to MEEP server", obj)
        //       return obj;
        //   }
        //   return { url }
        // }}
      >
        {Object.entries(TILESETS)
          .map(([key, tileset]) => {
            if (!tileset.data) return null;
            const min =
              tileset.data.reduce(
                (min, p) => (p?.count! < min ? p?.count! : min),
                tileset.data?.[0]?.count!
              ) || 0;
            const max =
              tileset.data.reduce(
                (max, p) => (p?.count! > max ? p?.count! : max),
                tileset.data?.[0]?.count!
              ) || 1;

            // Uses 0-1 for easy interpolation
            // go from 0-100% and return real numbers
            const legendScale = scaleLinear().domain([0, 1]).range([min, max]);

            // Map real numbers to colours
            const colourScale = scaleSequential()
              .domain([min, max])
              .interpolator(interpolateInferno);

            // Text scale
            const textScale = scaleLinear().domain([min, max]).range([1, 1.5]);

            const inDataFilter = [
              "in",
              ["get", tileset.promoteId],
              ["literal", tileset.data.map((d) => d.gss)],
            ];

            const steps = Math.min(max, 30);
            const colourStops = new Array(steps - 1)
              .fill(0)
              .map((_, i) => i / steps)
              .map((n) => [legendScale(n), colourScale(legendScale(n))])
              .flat();

            return (
              <Fragment key={tileset.mapboxSourceId}>
                <Source
                  id={tileset.mapboxSourceId}
                  type="vector"
                  url={`mapbox://${tileset.mapboxSourceId}`}
                  promoteId={tileset.promoteId}
                  {...(tileset.mapboxSourceProps || {})}
                >
                  {/* Shade area by count */}
                  <Layer
                    id={`${tileset.mapboxSourceId}-fill`}
                    source={tileset.mapboxSourceId}
                    source-layer={tileset.sourceLayerId}
                    type="fill"
                    filter={inDataFilter}
                    paint={{
                      // Shade the map by the count of imported data
                      "fill-color": [
                        "interpolate",
                        ["linear"],
                        ["to-number", ["feature-state", "count"], 0],
                        ...colourStops,
                      ],
                      "fill-opacity": [
                        "interpolate",
                        ["linear"],
                        ["zoom"],
                        MAX_REGION_ZOOM,
                        0.5,
                        MAX_CONSTITUENCY_ZOOM,
                        0.2,
                      ],
                    }}
                    {...(tileset.mapboxLayerProps || {})}
                  />
                  {/* Border of the boundary */}
                  <Layer
                    filter={inDataFilter}
                    id={`${tileset.mapboxSourceId}-line`}
                    source={tileset.mapboxSourceId}
                    source-layer={tileset.sourceLayerId}
                    type="line"
                    paint={{
                      "line-color": "white",
                      "line-width": 1.5,
                      "line-opacity": 0.5,
                    }}
                    {...(tileset.mapboxLayerProps || {})}
                  />
                </Source>
                <Source
                  id={`${tileset.mapboxSourceId}-db-point`}
                  type="geojson"
                  data={{
                    type: "FeatureCollection",
                    features: tileset.data
                      .filter((d) => d.gssArea?.point?.geometry)
                      .map((d) => {
                        return {
                          type: "Feature",
                          geometry: d.gssArea?.point
                            ?.geometry! as GeoJSON.Point,
                          properties: {
                            count: d.count,
                            label: d.label,
                          },
                        };
                      }),
                  }}
                >
                  <Layer
                    id={`${tileset.mapboxSourceId}-label-count`}
                    source={`${tileset.mapboxSourceId}-db-point`}
                    type="symbol"
                    layout={{
                      "symbol-spacing": 1000,
                      "text-field": ["get", "count"],
                      "text-size": [
                        "interpolate",
                        ["linear"],
                        ["get", "count"],
                        min,
                        textScale(min) * 17,
                        max,
                        textScale(max) * 17,
                      ],
                      "symbol-placement": "point",
                      "text-offset": [0, -0.5],
                      "text-allow-overlap": true,
                      "text-ignore-placement": true,
                      "text-font": [
                        "DIN Offc Pro Medium",
                        "Arial Unicode MS Bold",
                      ],
                    }}
                    paint={{
                      "text-color": "white",
                      "text-halo-color": "black",
                      "text-halo-width": 0.3,
                    }}
                    {...(tileset.mapboxLayerProps || {})}
                  />
                  <Layer
                    id={`${tileset.mapboxSourceId}-label-name`}
                    source={`${tileset.mapboxSourceId}-db-point`}
                    type="symbol"
                    layout={{
                      "symbol-spacing": 1000,
                      "text-field": ["get", "label"],
                      "text-size": [
                        "interpolate",
                        ["linear"],
                        ["get", "count"],
                        min,
                        textScale(min) * 9,
                        max,
                        textScale(max) * 9,
                      ],
                      "text-font": [
                        "DIN Offc Pro Medium",
                        "Arial Unicode MS Bold",
                      ],
                      "symbol-placement": "point",
                      "text-offset": [0, 0.6],
                    }}
                    paint={{
                      "text-color": "white",
                      "text-opacity": 0.9,
                      "text-halo-color": "black",
                      "text-halo-width": 0.3,
                    }}
                    {...(tileset.mapboxLayerProps || {})}
                  />
                </Source>
              </Fragment>
            );
          })}
        {!!selectedConstituency && (
          <Layer
            filter={[
              "in",
              ["get", TILESETS.constituencies.promoteId],
              ["literal", selectedConstituency],
            ]}
            id={`${TILESETS.constituencies}-selected-line`}
            source={TILESETS.constituencies.mapboxSourceId}
            source-layer={TILESETS.constituencies.sourceLayerId}
            type="line"
            paint={{
              "line-color": "white",
              "line-width": 4,
              "line-opacity": 1,
            }}
          />
        )}
        {/* Wait for all icons to load */}
        {analytics.data?.mapReport.layers.map((layer, index) => {
          return (
            <MapboxGLClusteredPointsLayer
              key={layer?.source?.id || index}
              index={index}
              externalDataSourceId={layer?.source?.id}
            />
          );
        })}
        {!!selectedSourceMarker?.properties?.id && (
          <ErrorBoundary errorComponent={() => <></>}>
            <Popup
              key={selectedSourceMarker.properties.id}
              longitude={
                (selectedSourceMarker.geometry as Point)?.coordinates?.[0] || 0
              }
              latitude={
                (selectedSourceMarker.geometry as Point)?.coordinates[1] || 0
              }
              closeOnClick={false}
              className="text-black [&>.mapboxgl-popup-content]:p-0 [&>.mapboxgl-popup-content]:overflow-auto w-[150px] [&>.mapboxgl-popup-tip]:!border-t-meepGray-200"
              closeButton={false}
              closeOnMove={false}
              anchor="bottom"
              offset={[0, -35] as any}
            >
              {selectedPointLoading ? (
                <div className="font-IBMPlexMono p-2 space-y-1 bg-white">
                  <div className="-space-y-1">
                    <div className="text-meepGray-400">LOADING</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="font-IBMPlexMono p-2 space-y-1 bg-white">
                    {!!selectedPointData?.importedDataGeojsonPoint?.properties?.name && (
                      <div className="-space-y-1">
                        <div className="text-meepGray-400">NAME</div>
                        <div>{selectedPointData?.importedDataGeojsonPoint.properties.name}</div>
                      </div>
                    )}
                    {!!selectedPointData?.importedDataGeojsonPoint?.properties?.postcodeData?.postcode && (
                      <div className="-space-y-1">
                        <div className="text-meepGray-400">POSTCODE</div>
                        <pre>
                          {
                            selectedPointData?.importedDataGeojsonPoint.properties.postcodeData
                              .postcode
                          }
                        </pre>
                      </div>
                    )}
                  </div>
                  <footer className="flex-divide-x bg-meepGray-200 text-meepGray-500 flex flex-row justify-around w-full py-1 px-2 text-center">
                    {!!selectedPointData?.importedDataGeojsonPoint?.properties?.phone && (
                      <a
                        href={`tel:${selectedPointData?.importedDataGeojsonPoint?.properties?.phone}`}
                        target="_blank"
                      >
                        Call
                      </a>
                    )}
                    {!!selectedPointData?.importedDataGeojsonPoint?.properties?.phone && (
                      <a
                        href={`sms:${selectedPointData?.importedDataGeojsonPoint?.properties?.phone}`}
                        target="_blank"
                      >
                        SMS
                      </a>
                    )}
                    {!!selectedPointData?.importedDataGeojsonPoint?.properties?.email && (
                      <a
                        href={`mailto:${selectedPointData?.importedDataGeojsonPoint?.properties.email}`}
                        target="_blank"
                      >
                        Email
                      </a>
                    )}
                    {!!selectedPointData?.importedDataGeojsonPoint?.properties?.remoteUrl && (
                      <a
                        href={`${selectedPointData?.importedDataGeojsonPoint?.properties?.remoteUrl}`}
                        target="_blank"
                      >
                        Link
                      </a>
                    )}
                  </footer>
                </>
              )}
            </Popup>
          </ErrorBoundary>
        )}
      </Map>
    </>
  );
}

function MapboxGLClusteredPointsLayer ({ externalDataSourceId, index }: { externalDataSourceId: string, index: number }) {
  const mapbox = useLoadedMap()
  const [selectedSourceMarker, setSelectedSourceMarker] =  useAtom(selectedSourceMarkerAtom)

  useEffect(function selectMarker() {
    mapbox.loadedMap?.on('mouseover', `${externalDataSourceId}-marker`, () => {
      const canvas = mapbox.loadedMap?.getCanvas()
      if (!canvas) return
      canvas.style.cursor = 'pointer'
    })
    mapbox.loadedMap?.on('mouseleave', `${externalDataSourceId}-marker`, () => {
      const canvas = mapbox.loadedMap?.getCanvas()
      if (!canvas) return
      canvas.style.cursor = ''
    })
    mapbox.loadedMap?.on('click', `${externalDataSourceId}-marker`, event => {
      const feature = event.features?.[0]
      if (feature?.properties?.id) {
        setSelectedSourceMarker(feature)
      }
    })
  }, [mapbox.loadedMap, externalDataSourceId])
  
  return (
    <>
      <Source
        id={externalDataSourceId}
        type="vector"
        url={`${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/tiles/external-data-source/${externalDataSourceId}/tiles.json`}
        minzoom={MIN_MEMBERS_ZOOM}
      >
        {index <= 1 ? (
          <Layer
            id={`${externalDataSourceId}-marker`}
            source={externalDataSourceId}
            source-layer={"generic_data"}
            type="symbol"
            layout={{
              "icon-image": `meep-marker-${index}`,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-size": 0.75,
              "icon-anchor": "bottom"
            }}
            minzoom={MIN_MEMBERS_ZOOM}
            {...(
              selectedSourceMarker?.properties?.id
              ? { filter: ["!=", selectedSourceMarker?.properties?.id, ["get", "id"]] }
              : {}
            )}
          />
        ) : (
          <Layer
            id={`${externalDataSourceId}-marker`}
            source={externalDataSourceId}
            source-layer={"generic_data"}
            type="circle"
            paint={{
              "circle-radius": 0.2,
              "circle-color": layerColour(index, externalDataSourceId),
            }}
            minzoom={MIN_MEMBERS_ZOOM}
            {...(
              selectedSourceMarker?.properties?.id
              ? { filter: ["!=", selectedSourceMarker.properties.id, ["get", "id"]] }
              : {}
            )}
          />
        )}
        {!!selectedSourceMarker?.properties?.id && (
          <Layer
            id={`${externalDataSourceId}-marker-selected`}
            source={externalDataSourceId}
            source-layer={"generic_data"}
            type="symbol"
            layout={{
              "icon-image": "meep-marker-selected",
              "icon-size": 0.75,
              "icon-anchor": "bottom",
              "icon-allow-overlap": true,
              "icon-ignore-placement": true
            }}
            minzoom={MIN_MEMBERS_ZOOM}
            filter={["==", selectedSourceMarker.properties.id, ["get", "id"]]}
          />
        )}
      </Source>
    </>
  )
}

const MAP_REPORT_LAYER_POINT = gql`
query MapReportLayerGeoJSONPoint($genericDataId: String!) {
  importedDataGeojsonPoint(genericDataId: $genericDataId) {
    id
    type
    geometry {
      type
      coordinates
    }
    properties {
      id
      lastUpdate
      name
      phone
      email
      postcodeData {
        postcode
      }
      json
      remoteUrl
    }
  }
}
`

export const MAP_REPORT_LAYER_ANALYTICS = gql`
  query MapReportLayerAnalytics($reportID: ID!) {
    mapReport(pk: $reportID) {
      id
      layers {
        id
        name
        source {
          id
          organisation {
            name
          }
        }
      }
    }
  }
`

const MAP_REPORT_REGION_STATS = gql`
  query MapReportRegionStats($reportID: ID!) {
    mapReport(pk: $reportID) {
      importedDataCountByRegion {
        label
        gss
        count
        gssArea {
          point {
            id
            type
            geometry {
              type
              coordinates
            }
          }
        }
      }
    }
  }
`

const MAP_REPORT_CONSTITUENCY_STATS = gql`
  query MapReportConstituencyStats($reportID: ID!) {
    mapReport(pk: $reportID) {
      importedDataCountByConstituency {
        label
        gss
        count
        gssArea {
          point {
            id
            type
            geometry {
              type
              coordinates
            }
          }
        }
      }
    }
  }
`

const MAP_REPORT_WARD_STATS = gql`
  query MapReportWardStats($reportID: ID!) {
    mapReport(pk: $reportID) {
      importedDataCountByWard {
        label
        gss
        count
        gssArea {
          point {
            id
            type
            geometry {
              type
              coordinates
            }
          }
        }
      }
    }
  }
`