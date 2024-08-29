"use client";

import { layerColour, useLoadedMap } from "@/lib/map";
import { useAtom } from "jotai";
import { selectedHubSourceMarkerAtom } from "@/components/hub/data";
import { useEffect } from "react";
import { Layer, Source } from "react-map-gl";
import { BACKEND_URL } from "@/env";
import { useHubRenderContext } from "./HubRenderContext";
import { GetHubMapDataQuery } from "@/__generated__/graphql";

export function HubPointMarkers({
  layer,
  index,
  beforeId,
}: {
  layer: NonNullable<GetHubMapDataQuery["hubByHostname"]>["layers"][number];
  index: number;
  beforeId?: string;
}) {
  const mapbox = useLoadedMap();
  const context = useHubRenderContext();
  const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(
    selectedHubSourceMarkerAtom
  );

  useEffect(
    function selectMarker() {
      mapbox.loadedMap?.on(
        "mouseover",
        `${layer.source.id}-marker`,
        (event) => {
          const canvas = mapbox.loadedMap?.getCanvas();
          if (!canvas) return;
          canvas.style.cursor = "pointer";
        }
      );
      mapbox.loadedMap?.on(
        "mouseleave",
        `${layer.source.id}-marker`,
        (event) => {
          const canvas = mapbox.loadedMap?.getCanvas();
          if (!canvas) return;
          canvas.style.cursor = "";
        }
      );
      if (layer.type === "events") {
        mapbox.loadedMap?.on("click", `${layer.source.id}-marker`, (event) => {
          const feature = event.features?.[0];
          if (feature?.properties?.id) {
            setSelectedSourceMarker(feature);
            context.goToEventId(feature.properties.id);
          }
        });
      }
    },
    [mapbox.loadedMap, layer.source.id]
  );

  return (
    <>
      {layer.type === "members" ? (
        <Source
          id={layer.source.id}
          type="geojson"
          data={new URL(
            `/tiles/external-data-source/${layer.source.id}/geojson`,
            BACKEND_URL
          ).toString()}
          cluster={true}
          clusterMaxZoom={100}
          clusterRadius={50}
          clusterProperties={{
            sum: ["+", ["get", "count"]]
          }}
        >
          <Layer
            id={`${layer.source.id}-cluster`}
            beforeId={beforeId}
            type="circle"
            source={layer.source.id}
            filter={['has', 'sum']}
            paint={{
              "circle-color": "rgba(24, 164, 127, 0.80)",
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                20,
                15,
                60,
              ],
            }}
          />
          <Layer
            id={`${layer.source.id}-cluster-count`}
            beforeId={beforeId}
            type="symbol"
            source={layer.source.id}
            filter={['has', 'sum']}
            layout={{
              'text-field': ['get', 'sum'],
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12
            }}
          />
          <Layer
            id={`${layer.source.id}-circle`}
            beforeId={beforeId}
            type="circle"
            source={layer.source.id}
            filter={['all', ['!', ['has', 'sum']], ['>', ['get', 'count'], 1]]}
            paint={{
              "circle-color": "rgba(24, 164, 127, 0.80)",
              "circle-radius": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                20,
                15,
                60,
              ],
            }}
          />
          <Layer
            id={`${layer.source.id}-circle-count`}
            beforeId={beforeId}
            type="symbol"
            source={layer.source.id}
            filter={['all', ['!', ['has', 'sum']], ['>', ['get', 'count'], 1]]}
            layout={{
              'text-field': ['get', 'count'],
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12
            }}
          />
          <Layer
            beforeId={beforeId}
            id={`${layer.source.id}-marker`}
            source={layer.source.id}
            type="symbol"
            filter={['all', ['!', ['has', 'sum']], ['==', ['get', 'count'], 1]]}
            layout={{
              "icon-image": layer.iconImage
                ? layer.iconImage
                : `tcc-event-marker`,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-size": layer.iconImage ? 1.25 : 0.75,
              "icon-anchor": "bottom",
              ...(layer.mapboxLayout || {}),
            }}
            paint={layer.mapboxPaint || {}}
          />
        </Source>
      ) : (
        <Source
          id={layer.source.id}
          type="vector"
          url={new URL(
            `/tiles/external-data-source/${context.hostname}/${layer.source.id}/tiles.json`,
            BACKEND_URL
          ).toString()}
        >
          {/* {index <= 1 ? ( */}
          <Layer
            beforeId={beforeId}
            id={`${layer.source.id}-marker`}
            source={layer.source.id}
            source-layer={"generic_data"}
            type="symbol"
            layout={{
              "icon-image": layer.iconImage
                ? layer.iconImage
                : `tcc-event-marker`,
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "icon-size": layer.iconImage ? 1.25 : 0.75,
              "icon-anchor": "bottom",
              ...(layer.mapboxLayout || {}),
            }}
            paint={layer.mapboxPaint || {}}
            // {...(
            //   selectedSourceMarker?.properties?.id
            //   ? { filter: ["!=", selectedSourceMarker?.properties?.id, ["get", "id"]] }
            //   : {}
            // )}
          />
          {/* ) : (
            // In case extra layers are added.
            <Layer
              beforeId={beforeId}
              id={`${externalDataSourceId}-marker`}
              source={externalDataSourceId}
              source-layer={"generic_data"}
              type="circle"
              paint={{
                "circle-radius": 5,
                "circle-color": layerColour(index, externalDataSourceId),
              }}
              {...(
                selectedSourceMarker?.properties?.id
                ? { filter: ["!=", selectedSourceMarker?.properties?.id, ["get", "id"]] }
                : {}
              )}
            />
          )}
          {!!selectedSourceMarker?.properties?.id && (
            <Layer
              beforeId={beforeId}
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
              filter={["==", selectedSourceMarker.properties.id, ["get", "id"]]}
            />
          )} */}
        </Source>
      )}
    </>
  );
}
