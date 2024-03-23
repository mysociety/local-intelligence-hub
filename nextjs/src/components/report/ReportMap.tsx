"use client"

import { GroupedDataCount, MapReportLayersSummaryFragment, MapReportLayerAnalyticsQuery, MapReportLayerAnalyticsQueryVariables, MapReportLayerGeoJsonPointsQuery, MapReportLayerGeoJsonPointsQueryVariables } from "@/__generated__/graphql";
import { Fragment, useContext, useEffect, useId, useRef, useState } from "react";
import Map, { Layer, MapRef, Source, LayerProps, ImageSourceRaw, Marker, Popup, useMap, ViewState } from "react-map-gl";
import { gql, useFragment, useQuery } from "@apollo/client";
import { ReportContext } from "@/app/reports/[id]/context";
import { scaleLinear, scaleSequential } from 'd3-scale'
import { interpolateInferno } from 'd3-scale-chromatic'
import { atom, useAtom } from "jotai";
import { atomWithHash } from "jotai-location"
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { z } from "zod";
import { layerColour, useLoadedMap } from "@/app/reports/[id]/lib";
import { isConstituencyPanelOpenAtom } from "@/app/reports/[id]/page";
import { constituencyPanelTabAtom } from "@/app/reports/[id]/ConstituenciesPanel";

const MAX_REGION_ZOOM = 8
export const MAX_CONSTITUENCY_ZOOM = 11.5
const MIN_MEMBERS_ZOOM = MAX_CONSTITUENCY_ZOOM

const viewStateAtom = atom<Partial<ViewState>>({
  longitude: -2.296605,
  latitude: 53.593349,
  zoom: 6
})

export const SelectedMarkerFeatureParser = z.object({
  type: z.literal('Feature'),
  id: z.string(),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: z
    .object({
      originalUrl: z.string().url(),
      id: z.string(),
      lastUpdate: z.coerce.date(),
      name: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      json: z.preprocess(
        j => JSON.parse(j?.toString() || "{}"),
        z.object({})
          .passthrough()
      ),
      postcodeData: z.preprocess(
        j => JSON.parse(j?.toString() || "{}"),
        z.object({
          postcode: z.string(),
        })
      )
    })
    // pass through unknown keys (https://zod.dev/?id=passthrough)
    .passthrough()
});

export const SelectedMarkerParser = z.object({
  externalDataSourceId: z.string(),
  id: z.string(),
  feature: SelectedMarkerFeatureParser,
});

export const selectedSourceRecordAtom = atom<z.infer<typeof SelectedMarkerParser> | null>(null)

export const selectedConstituencyAtom = atomWithHash<string | null>('constituency', null)

export function ReportMap () {
  const { id } = useContext(ReportContext)
  const analytics = useQuery<MapReportLayerAnalyticsQuery, MapReportLayerAnalyticsQueryVariables>(MAP_REPORT_LAYER_ANALYTICS, {
    variables: {
      reportID: id,
    }
  })

  const mapbox = useLoadedMap()

  const TILESETS: Record<"EERs" | "constituencies" | "wards", {
    name: string,
    singular: string,
    mapboxSourceId: string,
    sourceLayerId?: string,
    promoteId: string,
    labelId: string,
    mapboxSourceProps?: { maxzoom?: number },
    mapboxLayerProps?: Omit<LayerProps, 'type' | 'url' | 'id' | 'paint' | 'layout'>,
    data: MapReportLayerAnalyticsQuery['mapReport']['importedDataCountByRegion'],
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
      data: analytics.data?.mapReport.importedDataCountByRegion || [],
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
      data: analytics.data?.mapReport.importedDataCountByConstituency || [],
      mapboxSourceProps: {
      //   maxzoom: MAX_CONSTITUENCY_ZOOM,
      },
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
      data: analytics.data?.mapReport.importedDataCountByWard || [],
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

  const [selectedSourceRecord, setSelectedSourceRecord] = useAtom(selectedSourceRecordAtom)
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

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      {...viewState}
      onMove={(e) => setViewState(e.viewState)}
      mapStyle="mapbox://styles/commonknowledge/clty3prwh004601pr4nqn7l9s"
      onClick={() => setSelectedSourceRecord(null)}
    >
      {!analytics.data && null}
      {!!analytics.data && Object.entries(TILESETS).map(([key, tileset]) => {
        const min = tileset.data.reduce(
          (min, p) => p?.count! < min ? p?.count! : min,
          tileset.data?.[0]?.count!
        ) || 0
        const max = tileset.data.reduce(
          (max, p) => p?.count! > max ? p?.count! : max,
          tileset.data?.[0]?.count!
        ) || 1

        // Uses 0-1 for easy interpolation
        // go from 0-100% and return real numbers
        const legendScale = scaleLinear()
          .domain([0, 1])
          .range([min, max])

        // Map real numbers to colours
        const colourScale = scaleSequential()
          .domain([min, max])
          .interpolator(interpolateInferno)

        // Text scale
        const textScale = scaleLinear()
          .domain([min, max])
          .range([1, 1.5])

        const inDataFilter = [
          "in",
          ["get", tileset.promoteId],
          ["literal", tileset.data.map(d => d.gss)],
        ]
      
        const steps = Math.min(max, 30)
        const colourStops = (new Array(steps - 1)).fill(0).map((_, i) => i / steps).map(
          (n) => [
            legendScale(n),
            colourScale(legendScale(n))
          ]
        ).flat()

        return (
          <Fragment key={tileset.mapboxSourceId}>
            <Source
              id={tileset.mapboxSourceId}
              type="vector"
              url={`mapbox://${tileset.mapboxSourceId}`}
              promoteId={tileset.promoteId}
              {...tileset.mapboxSourceProps || {}}
            >
              {/* Shade area by count */}
              <Layer
                id={`${tileset.mapboxSourceId}-fill`}
                // beforeId="building"
                source={tileset.mapboxSourceId}
                source-layer={tileset.sourceLayerId}
                type="fill"
                filter={inDataFilter}
                paint={{
                  // Shade the map by the count of imported data
                  "fill-color": [
                    "interpolate",
                    ["linear"],
                    ['to-number', ["feature-state", "count"], 0],
                    ...colourStops
                  ],
                  "fill-opacity": [
                    "interpolate",
                    ["linear"],
                    ["zoom"],
                    MAX_REGION_ZOOM, 0.5,
                    MAX_CONSTITUENCY_ZOOM, 0.2,
                  ]
                }}
                {...tileset.mapboxLayerProps || {}}
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
                  "line-opacity": 0.5
                }}
                {...tileset.mapboxLayerProps || {}}
              />
            </Source>
            <Source
              id={`${tileset.mapboxSourceId}-db-point`}
              type="geojson"
              data={{
                type: "FeatureCollection",
                // @ts-ignore
                features: tileset.data.map((d) => {
                  return {
                    type: "Feature",
                    geometry: d.gssArea?.point?.geometry,
                    properties: {
                      count: d.count,
                      label: d.label,
                    }
                  }
                })
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
                    min, textScale(min) * 17,
                    max, textScale(max) * 17,
                  ],
                  "symbol-placement": "point",
                  "text-offset": [0, -0.5],
                  "text-allow-overlap": true,
                  "text-ignore-placement": true,
                  "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                }}
                paint={{
                  "text-color": "white",
                  "text-halo-color": "black",
                  "text-halo-width": 0.3,
                }}
                {...tileset.mapboxLayerProps || {}}
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
                    min, textScale(min) * 9,
                    max, textScale(max) * 9,
                  ],
                  "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                  "symbol-placement": "point",
                  "text-offset": [0, 0.6],
                }}
                paint={{
                  "text-color": "white",
                  "text-opacity": 0.9,
                  "text-halo-color": "black",
                  "text-halo-width": 0.3,
                }}
                {...tileset.mapboxLayerProps || {}}
              />
            </Source>
          </Fragment>
        )
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
            "line-opacity": 1
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
        )
      })}
      {!!selectedSourceRecord?.feature?.geometry?.coordinates?.length && (
        <ErrorBoundary errorComponent={() => <></>}>
          <Popup
            key={selectedSourceRecord.id}
            longitude={selectedSourceRecord?.feature?.geometry?.coordinates?.[0] || 0}
            latitude={selectedSourceRecord?.feature?.geometry?.coordinates?.[1] || 0}
            closeOnClick={false}
            className="text-black [&>.mapboxgl-popup-content]:p-0 [&>.mapboxgl-popup-content]:overflow-auto w-[150px] [&>.mapboxgl-popup-tip]:!border-t-meepGray-200"
            closeButton={false}
            closeOnMove={false}
            anchor="bottom"
            // @ts-ignore bizarre library typing issue
            offset={[0, -35] as any}
          >
            <div className='font-IBMPlexMono p-2 space-y-1 bg-white'>
              {!!selectedSourceRecord.feature.properties.name && (
                <div className='-space-y-1'>
                  <div className='text-meepGray-400'>NAME</div>
                  <div>{selectedSourceRecord.feature.properties.name}</div>
                </div>
              )}
              {!!selectedSourceRecord.feature.properties.postcodeData.postcode && (
                <div className='-space-y-1'>
                  <div className='text-meepGray-400'>POSTCODE</div>
                  <pre>{selectedSourceRecord.feature.properties.postcodeData.postcode}</pre>
                </div>
              )}
            </div>
            <footer className='flex-divide-x bg-meepGray-200 text-meepGray-500 flex flex-row justify-around w-full py-1 px-2 text-center'>
              {!!selectedSourceRecord.feature.properties.phone && (
                <a href={`tel:${selectedSourceRecord.feature.properties.phone}`} target="_blank">
                  Call
                </a>
              )}
              {!!selectedSourceRecord.feature.properties.phone && (
                <a href={`sms:${selectedSourceRecord.feature.properties.phone}`} target="_blank">
                  SMS
                </a>
              )}
              {!!selectedSourceRecord.feature.properties.email && (
                <a href={`mailto:${selectedSourceRecord.feature.properties.email}`} target="_blank">
                  Email
                </a>
              )}
              {!!selectedSourceRecord.feature.properties.email && (
                <a href={`${selectedSourceRecord.feature.properties.originalUrl}`} target="_blank">
                  Link
                </a>
              )}
            </footer>
          </Popup>
        </ErrorBoundary>
      )}
    </Map>
  )
}

function MapboxGLClusteredPointsLayer ({ externalDataSourceId, index }: { externalDataSourceId: string, index: number }) {
  const { data, error } = useQuery<MapReportLayerGeoJsonPointsQuery, MapReportLayerGeoJsonPointsQueryVariables>(MAP_REPORT_LAYER_POINTS, {
    variables: {
      externalDataSourceId,
    },
  });

  const mapbox = useLoadedMap()
  const [selectedSourceRecord, setSelectedSourceRecord] = useAtom(selectedSourceRecordAtom)
  
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
      try {
        const feature = event.features?.[0]
        if (feature) {
          const id = feature.properties?.id
          const selectedRecord = SelectedMarkerParser.parse({
            externalDataSourceId,
            id,
            feature: {
              // MapboxGL's typings and actual data don't match up, so we try a few things
              ...feature,
              properties: {
                // @ts-ignore
                ...(feature.properties || feature._properties || {}),
                originalUrl: data?.externalDataSource.recordUrlTemplate?.replace("{record_id}", id)
              },
              // @ts-ignore
              geometry: feature.geometry || feature._geometry,
              id
            }
          })
          setSelectedSourceRecord(selectedRecord)
        }
      } catch (e) {
        // console.error("Failed to parse selected marker", e, event.features?.[0])
      }
    })
  }, [mapbox.loadedMap, data?.externalDataSource.recordUrlTemplate])
  
  return (
    <>
      <Source
        id={externalDataSourceId}
        type="geojson"
        data={{
          type: "FeatureCollection",
          // @ts-ignore
          features: data?.externalDataSource?.importedDataGeojsonPoints || []
        }}
      >
        {index <= 1 ? (
          <Layer
            source={externalDataSourceId}
            id={`${externalDataSourceId}-marker`}
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
              selectedSourceRecord?.id
              ? { filter: ["!=", selectedSourceRecord.id, ["get", "id"]] }
              : {}
            )}
          />
        ) : (
          <Layer
            source={externalDataSourceId}
            id={`${externalDataSourceId}-marker`}
            type="circle"
            paint={{
              "circle-radius": 0.2,
              "circle-color": layerColour(index, externalDataSourceId),
            }}
            minzoom={MIN_MEMBERS_ZOOM}
            {...(
              selectedSourceRecord?.id
              ? { filter: ["!=", selectedSourceRecord.id, ["get", "id"]] }
              : {}
            )}
          />
        )}
        {!!selectedSourceRecord?.id && (
          <Layer
            source={externalDataSourceId}
            id={`${externalDataSourceId}-marker-selected`}
            type="symbol"
            layout={{
              "icon-image": "meep-marker-selected",
              "icon-size": 0.75,
              "icon-anchor": "bottom",
              "icon-allow-overlap": true,
              "icon-ignore-placement": true
            }}
            minzoom={MIN_MEMBERS_ZOOM}
            {...(
              selectedSourceRecord?.id
              ? { filter: ["==", selectedSourceRecord.id, ["get", "id"]] }
              : {}
            )}
          />
        )}
      </Source>
    </>
  )
}

const MAP_REPORT_LAYER_POINTS = gql`
  query MapReportLayerGeoJSONPoints($externalDataSourceId: ID!) {
    externalDataSource(pk: $externalDataSourceId) {
      id
      recordUrlTemplate
      importedDataGeojsonPoints {
        id
        type
        geometry {
          type
          coordinates
        }
        properties {
          lastUpdate
          id
          name
          phone
          email
          postcodeData {
            postcode
          }
          json
        }
      }
    }
  }
`

export const MAP_REPORT_LAYER_ANALYTICS = gql`
  query MapReportLayerAnalytics($reportID: ID!) {
    mapReport(pk: $reportID) {
      id
      layers {
        name
        source {
          id
        }
      }
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