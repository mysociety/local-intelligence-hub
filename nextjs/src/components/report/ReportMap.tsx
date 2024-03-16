"use client"

import { GetSourceGeoJsonQuery, GetSourceGeoJsonQueryVariables, MapReportLayersSummaryFragment } from "@/__generated__/graphql";
import { ReportContext } from "@/app/reports/[id]/page";
import { useContext, useId } from "react";
import Map, { Layer, Marker, Popup, Source } from "react-map-gl";
import { MapReportLayersSummaryFragmentStr } from "../dataConfig";
import { gql, useFragment, useQuery } from "@apollo/client";

export function ReportMap () {
  const { id, update } = useContext(ReportContext)
  const layers = useFragment<MapReportLayersSummaryFragment>({
    fragment: MapReportLayersSummaryFragmentStr,
    fragmentName: "MapReportLayersSummary",
    from: {
      __typename: "MapReport",
      id,
    },
  });

  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      initialViewState={{
        longitude: -2.296605,
        latitude: 53.593349,
        zoom: 6
      }}
      mapStyle="mapbox://styles/commonknowledge/clqeaydxl00cd01qyhnk70s7s"
    >
      {layers.data.layers?.map((layer, index) => {
        return (
          <MapboxGLClusteredPointsLayer
            key={layer?.source.id || index}
            externalDataSourceId={layer?.source?.id}
          />
        )
      })}
    </Map>
  )
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
      <Source id={id} type="geojson" data={{
        type: "FeatureCollection",
        features: data?.externalDataSource?.geojsonData || []
      }}>
        <Layer
          id={`${id}-circle`}
          type="circle"
          source={id}
          paint={{
            "circle-radius": 10,
            "circle-color": "#007cbf",
          }}
        />
      </Source>
    </>
  )
}

const GET_SOURCE_DATA = gql`
  query GetSourceGeoJSON($externalDataSourceId: ID!) {
    externalDataSource(pk: $externalDataSourceId) {
      geojsonData {
        id
        type
        geometry {
          ... on PointGeometry {
            type
            coordinates
          }
        }
        properties
      }
    }
  }
`