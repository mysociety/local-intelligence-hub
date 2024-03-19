"use client"

import { GetSourceGeoJsonQuery, GetSourceGeoJsonQueryVariables, GroupedDataCount, MapReportLayersSummaryFragment } from "@/__generated__/graphql";
import { useContext, useEffect, useId, useRef } from "react";
import Map, { Layer, MapRef, Marker, Popup, Source, LayerProps, VectorSourceRaw } from "react-map-gl";
import { MAP_REPORT_LAYERS_SUMMARY } from "../dataConfig";
import { gql, useFragment, useQuery } from "@apollo/client";
import { ReportContext } from "@/app/reports/[id]/context";
import { Expression } from "mapbox-gl";
import { scaleSequential } from 'd3-scale'
import { interpolatePlasma } from 'd3-scale-chromatic'

export function ReportMap () {
  const { id, update } = useContext(ReportContext)
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
    sourceId: string,
    sourceLayerId?: string,
    promoteId: string,
    labelId: string,
    mapboxSourceProps: Omit<VectorSourceRaw, 'type' | 'url' | 'id'>,
    mapboxLayerProps?: Omit<LayerProps, 'type' | 'url' | 'id' | 'paint' | 'layout'>,
    data: Array<GroupedDataCount>,
    downloadUrl?: string
  }> = {
    EERs: {
      name: "regions",
      singular: "region",
      sourceId: "commonknowledge.awsfhx20",
      downloadUrl: "https://ckan.publishing.service.gov.uk/dataset/european-electoral-regions-december-2018-boundaries-uk-buc1/resource/b268c97f-2507-4477-9149-0a0c5d2bfbca",
      sourceLayerId: "European_Electoral_Regions_De-bxyqod",
      promoteId: "eer18cd",
      labelId: "eer18nm",
      // @ts-ignore
      data: layers.data.importedDataCountByRegion || [],
      mapboxSourceProps: {
        maxzoom: 9.5
      },
      mapboxLayerProps: {
        maxzoom: 9.5
      }
    },
    constituencies: {
      name: "GE2019 constituencies",
      singular: "constituency",
      sourceId: "commonknowledge.4xqg91lc",
      sourceLayerId: "Westminster_Parliamentary_Con-6i1rlq",
      promoteId: "pcon16cd",
      labelId: "pcon16nm",
      // @ts-ignore
      data: layers.data.importedDataCountByConstituency || [],
      mapboxSourceProps: {
        minzoom: 9.5,
        maxzoom: 13,
      },
      mapboxLayerProps: {
        minzoom: 9.5,
        maxzoom: 13,
      }
    },
    // constituencies2024: {
    //   name: "GE2024 constituencies",
    //   singular: "constituency",
    //   sourceId: "commonknowledge.b5t8td4w"
      // promoteId: "PCON25CD",
      // labelId: "PCON25NM"
    // },
    // councils: {
    //   name: "councils",
    //   singular: "council",
    //   sourceId: "commonknowledge.9zcvsx9l",
    //   promoteId: "ctyua_code",
    //   labelId: "ctyua_name",
    // },
    wards: {
      name: "wards",
      singular: "ward",
      sourceId: "commonknowledge.0rzbo365",
      promoteId: "WD23CD",
      labelId: "WD23NM",
      // @ts-ignore
      data: layers.data.importedDataCountByWard || [],
      mapboxSourceProps: {
        minzoom: 13,
        maxzoom: 18,
      },
      mapboxLayerProps: {
        minzoom: 13,
        maxzoom: 18,
      }
    }
  }

  useEffect(function setFeatureState() {
    layers.data.importedDataCountByRegion?.forEach((region) => {
      if (region?.areaId && region?.count) {
        mapboxRef.current?.setFeatureState({
          source: TILESETS.EERs.sourceId,
          sourceLayer: TILESETS.EERs.sourceLayerId,
          id: region.areaId,
        }, {
          count: region.count,
          // ...layers.data.layers?.map((layer) => {
          //   return {
          //     [layer?.source!.id]: layer?.source?.importedDataCountByRegion?.find(r => r?.areaId === region.areaId)?.count
          //   }
          // })
        })
        console.log("setFeatureState", region.areaId, region.count)
      }
    })
    // layers.data.layers?.forEach((layer) => {
    //   if (layer?.source) {
    //     layer.source.importedDataCountByRegion?.forEach((region) => {
    //       if (region?.areaId && region?.count) {
    //         mapboxRef.current?.setFeatureState({
    //           source: TILESETS.EERs.sourceId,
    //           id: region.areaId,
    //         }, {
    //           totalCount: 
    //           [layer.source!.id]: region.count,
    //         })
    //       }
    //     })
    //   }
    // })
  }, [layers, mapboxRef])

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
    >
      {Object.entries(TILESETS).map(([key, tileset]) => {
        const min = tileset.data.reduce(
          (min, p) => p?.count! < min ? p?.count! : min,
          tileset.data?.[0]?.count!
        ) || 0
        const max = tileset.data.reduce(
          (max, p) => p?.count! > max ? p?.count! : max,
          tileset.data?.[0]?.count!
        ) || 1
        const scale = scaleSequential()
          .domain([min, max])
          .interpolator(interpolatePlasma)
        console.log(scale)

        return (
          <Source
            id={tileset.sourceId}
            type="vector"
            url={`mapbox://${tileset.sourceId}`}
            promoteId={tileset.promoteId}
            {...tileset.mapboxSourceProps || {}}
          >
            {/* Shade area by count */}
            <Layer
              id={`${tileset.sourceId}-fill`}
              source={tileset.sourceId}
              source-layer={tileset.sourceLayerId}
              type="fill"
              paint={{
                // Shade the map by the count of imported data
                "fill-color": [
                  "interpolate",
                  ["linear"],
                  ['to-number', ["feature-state", "count"], 0],
                  min, scale(min),
                  max, scale(max),
                ]
              }}
              {...tileset.mapboxLayerProps || {}}
            />
            {/* Border of the boundary */}
            <Layer
              id={`${tileset.sourceId}-line`}
              source={tileset.sourceId}
              source-layer={tileset.sourceLayerId}
              type="line"
              paint={{
                "line-color": "hsl(222, 69%, 65%)",
                "line-width": 2,
              }}
              {...tileset.mapboxLayerProps || {}}
            />
            {/* Display count as a number in the centre of the area by a symbol layer */}
            <Layer
              id={`${tileset.sourceId}-label-count`}
              source={tileset.sourceId}
              source-layer={tileset.sourceLayerId}
              type="symbol"
              layout={{
                "symbol-spacing": 1000,
                "text-field": matchMap(
                  tileset.data || [],
                  tileset.promoteId,
                  "areaId",
                  d => d.count?.toString() || "",
                  "?"
                ),
                "text-size": 25,
                "symbol-placement": "point",
                "text-offset": [0, -0.5],
                "text-allow-overlap": true,
                // "text-variable-anchor": ["center"],
                // "text-ignore-placement": true,
              }}
              paint={{
                "text-color": "white",
              }}
              {...tileset.mapboxLayerProps || {}}
            />
            <Layer
              id={`${tileset.sourceId}-label-name`}
              source={tileset.sourceId}
              source-layer={tileset.sourceLayerId}
              type="symbol"
              layout={{
                "symbol-spacing": 1000,
                "text-field": matchMap(
                  tileset.data || [],
                  tileset.promoteId,
                  "areaId",
                  d => d.label || "",
                  "?"
                ),
                "text-size": 13,
                "symbol-placement": "point",
                "text-offset": [0, 0.6],
                "text-allow-overlap": true,
                // "text-variable-anchor": ["center"],
                // "text-ignore-placement": true,
              }}
              paint={{
                "text-color": "white",
                "text-opacity": 0.7
              }}
              {...tileset.mapboxLayerProps || {}}
            />
          </Source>
        )
      })}
      {layers.data.layers?.map((layer, index) => {
        return (
          <MapboxGLClusteredPointsLayer
            key={layer?.source?.id || index}
            externalDataSourceId={layer?.source?.id}
          />
        )
      })}
    </Map>
  )
}

function matchMap<T extends Record<string, any>>(data: Array<T>, mapboxIdField: string, dataIdField: string, value: (d: T) => string, defaultValue: any): Expression {
  // For each fromId value, find the corresponding toId value and return the valueId
  const expression: Expression = [
    "match",
    ["get", mapboxIdField],
    ...data.map((d) => {
      return [
        // If
        d[dataIdField],
        // Then
        value(d),
      ]
    }).filter((d) => !!d[0]).flat(),
    defaultValue
  ]
  return expression
}

function MapboxGLClusteredPointsLayer ({ externalDataSourceId }: { externalDataSourceId: string }) {
  const { data, error } = useQuery<GetSourceGeoJsonQuery, GetSourceGeoJsonQueryVariables>(GET_SOURCE_DATA, {
    variables: {
      externalDataSourceId,
    },
  });

  const id = useId()

  return (
    <>
      <Source
        id={id}
        type="geojson"
        data={{
          type: "FeatureCollection",
          // @ts-ignore TODO: Fix types
          features: data?.externalDataSource?.geojsonPointFeatures || []
        }}
      >
        <Layer
          id={`${id}-circle`}
          type="circle"
          source={id}
          paint={{
            "circle-radius": 6,
            "circle-color": `hsl(222, 69%, 65%)`,
          }}
          minzoom={18}
        />
      </Source>
    </>
  )
}

const GET_SOURCE_DATA = gql`
  query GetSourceGeoJSON($externalDataSourceId: ID!) {
    externalDataSource(pk: $externalDataSourceId) {
      geojsonPointFeatures {
        id
        type
        geometry {
          type
          coordinates
        }
      }
    }
  }
`