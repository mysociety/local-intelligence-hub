"use client"

import { GetSourceGeoJsonQuery, GetSourceGeoJsonQueryVariables, GroupedDataCount, MapReportLayersSummaryFragment } from "@/__generated__/graphql";
import { Fragment, useContext, useEffect, useId, useRef, useState } from "react";
import Map, { Layer, MapRef, Source, LayerProps, ImageSourceRaw, Marker, Popup, useMap } from "react-map-gl";
import { MAP_REPORT_LAYERS_SUMMARY } from "../dataConfig";
import { gql, useFragment, useQuery } from "@apollo/client";
import { ReportContext } from "@/app/reports/[id]/context";
import { scaleLinear, scaleSequential } from 'd3-scale'
import { interpolateInferno } from 'd3-scale-chromatic'
import { atom, useAtom } from "jotai";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { z } from "zod";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "../ui/button";
import { formatRelative } from "date-fns";

const MAX_REGION_ZOOM = 8
const MAX_CONSTITUENCY_ZOOM = 11.5
const MIN_MEMBERS_ZOOM = MAX_CONSTITUENCY_ZOOM

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

const selectedSourceRecordAtom = atom<z.infer<typeof SelectedMarkerParser> | null>(null)

export function ReportMap () {
  const { id } = useContext(ReportContext)
  const layers = useFragment<MapReportLayersSummaryFragment>({
    fragment: MAP_REPORT_LAYERS_SUMMARY,
    fragmentName: "MapReportLayersSummary",
    from: {
      __typename: "MapReport",
      id,
    },
  });

  const mapboxRef = useRef<MapRef>(null)

  const TILESETS: Record<string, {
    name: string,
    singular: string,
    mapboxSourceId: string,
    sourceLayerId?: string,
    promoteId: string,
    labelId: string,
    mapboxSourceProps?: { maxzoom?: number },
    mapboxLayerProps?: Omit<LayerProps, 'type' | 'url' | 'id' | 'paint' | 'layout'>,
    data: Array<GroupedDataCount>,
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
      // @ts-ignore
      data: layers.data.importedDataCountByRegion || [],
      mapboxSourceProps: {
        maxzoom: MAX_REGION_ZOOM
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
      // @ts-ignore
      data: layers.data.importedDataCountByConstituency || [],
      mapboxSourceProps: {
        maxzoom: MAX_CONSTITUENCY_ZOOM,
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
      // @ts-ignore
      data: layers.data.importedDataCountByWard || [],
      mapboxSourceProps: {},
      mapboxLayerProps: {
        minzoom: MAX_CONSTITUENCY_ZOOM,
      }
    }
  }

  useEffect(function setFeatureState() {
    if (!mapboxRef.current) return
    if (!layers.data) return
    Object.values(TILESETS)?.forEach((tileset) => {
      tileset.data?.forEach((area) => {
        if (area?.areaId && area?.count) {
          mapboxRef.current?.setFeatureState({
            source: tileset.mapboxSourceId,
            sourceLayer: tileset.sourceLayerId,
            id: area.areaId,
          }, {
            count: area.count
          })
        }
      })
    })
  }, [layers, TILESETS, mapboxRef])

  const requiredImages = [
    {
      url: () => new URL('/markers/default.png', window.location.href).toString(),
      name: 'meep-marker'
    },
    {
      url: () => new URL('/markers/selected.png', window.location.href).toString(),
      name: 'meep-marker-selected'
    }
  ]

  const [loadedImages, setLoadedImages] = useState<string[]>([])

  useEffect(function loadIcons() {
    if (!mapboxRef.current) return
    requiredImages.forEach((requiredImage) => {
      console.log("Loading", requiredImage.url())
      // Load an image from an external URL.
      mapboxRef.current!.loadImage(
        requiredImage.url(),
        (error, image) => {
          try {
            if (error) throw error;
            if (!image) throw new Error('Marker icon did not load')
            mapboxRef.current!.addImage(requiredImage.name, image);
            setLoadedImages(loadedImages => [...loadedImages, requiredImage.name])
          } catch (e) {
            console.error("Failed to load image", e)
          }
        }
      )
    })
  }, [mapboxRef.current, setLoadedImages])

  const [selectedSourceRecord, setSelectedSourceRecord] = useAtom(selectedSourceRecordAtom)

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      initialViewState={{
        longitude: -2.296605,
        latitude: 53.593349,
        zoom: 6
      }}
      mapStyle="mapbox://styles/commonknowledge/clty3prwh004601pr4nqn7l9s"
      ref={mapboxRef}
      onClick={() => setSelectedSourceRecord(null)}
    >
      {!layers.data && null}
      {!!layers.data && Object.entries(TILESETS).map(([key, tileset]) => {
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
          ["literal", tileset.data.map(d => d.areaId)],
        ]
      
        const steps = Math.min(max, 30)
        const colourStops = (new Array(steps)).fill(0).map((_, i) => i / steps).map(
          (n) => [
            Math.floor(legendScale(n)),
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
              {...tileset.mapboxSourceProps || {}}
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
      {/* Wait for all icons to load */}
      {layers.data.layers?.map((layer, index) => {
        return (
          <MapboxGLClusteredPointsLayer
            key={layer?.source?.id || index}
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
              {/* If phone */}
              {!!selectedSourceRecord.feature.properties.phone && (
                <a href={`tel:${selectedSourceRecord.feature.properties.phone}`} target="_blank">
                  Call
                </a>
              )}
              {/* Text */}
              {!!selectedSourceRecord.feature.properties.phone && (
                <a href={`sms:${selectedSourceRecord.feature.properties.phone}`} target="_blank">
                  SMS
                </a>
              )}
              {/* If email */}
              {!!selectedSourceRecord.feature.properties.email && (
                <a href={`mailto:${selectedSourceRecord.feature.properties.email}`} target="_blank">
                  Email
                </a>
              )}
              {/* If email */}
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

function MapboxGLClusteredPointsLayer ({ externalDataSourceId }: { externalDataSourceId: string }) {
  const { data, error } = useQuery<GetSourceGeoJsonQuery, GetSourceGeoJsonQueryVariables>(GET_SOURCE_DATA, {
    variables: {
      externalDataSourceId,
    },
  });

  const [selectedSourceRecord, setSelectedSourceRecord] = useAtom(selectedSourceRecordAtom)

  const map = useMap()
  
  useEffect(() => {
    map.current?.on('click', `${externalDataSourceId}-marker`, event => {
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
                originalUrl: data?.externalDataSource?.recordUrlTemplate?.replace("{record_id}", id)
              },
              // @ts-ignore
              geometry: feature.geometry || feature._geometry,
              id
            }
          })
          setSelectedSourceRecord(selectedRecord)
        }
      } catch (e) {
        console.error("Failed to parse selected marker", e, event.features?.[0])
      }
    })
  }, [map, data?.externalDataSource.recordUrlTemplate])
  
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
        <Layer
          source={externalDataSourceId}
          id={`${externalDataSourceId}-marker`}
          type="symbol"
          layout={{
            "icon-image": "meep-marker",
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
        {!!selectedSourceRecord?.id && (
          <Layer
            source={externalDataSourceId}
            id={`${externalDataSourceId}-marker-selected`}
            type="symbol"
            layout={{
              "icon-image": "meep-marker-selected",
              "icon-size": 0.75,
              "icon-anchor": "bottom"
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

const GET_SOURCE_DATA = gql`
  query GetSourceGeoJSON($externalDataSourceId: ID!) {
    externalDataSource(pk: $externalDataSourceId) {
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