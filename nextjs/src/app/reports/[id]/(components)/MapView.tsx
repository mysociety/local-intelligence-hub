'use client'

import LocalisedMap from '@/components/LocalisedMap'
import { PlaceholderLayer } from '@/components/PlaceholderLayer'
import { useActiveTileset, useMapBounds } from '@/lib/map'
import { useEffect } from 'react'
import { POLITICAL_BOUNDARIES } from '../politicalTilesets'
import { SpecificViewConfig, ViewType } from '../reportContext'
import useDataByBoundary from '../useDataByBoundary'
import PoliticalChoropleths from './MapLayers/PoliticalChoropleths'
import ReportMapChoroplethLegend from './MapLayers/ReportMapChoroplethLegend'
import ReportMapMarkers from './MapLayers/ReportMapMarkers'

export const PLACEHOLDER_LAYER_ID_CHOROPLETH = 'choropleths'
export const PLACEHOLDER_LAYER_ID_MARKERS = 'markers'

export default function MapView({
  mapView,
}: {
  mapView: SpecificViewConfig<ViewType.Map>
}) {
  const boundaryType = mapView.mapOptions.choropleth?.boundaryType
  const tilesets = POLITICAL_BOUNDARIES.find(
    (boundary) => boundary.boundaryType === boundaryType
  )?.tilesets

  const activeTileset = useActiveTileset(boundaryType)

  const { loading, fetchMore } = useDataByBoundary({
    mapOptions: mapView.mapOptions,
    tileset: activeTileset,
  })

  const [mapBounds] = useMapBounds()

  // Fetch more data when the map bounds change
  // This has to be here for the loading indicator to work
  // (fetchMore only triggers loading: true in its local hook)
  useEffect(() => {
    if (activeTileset.useBoundsInDataQuery) {
      fetchMore({
        variables: { mapBounds },
      })
    }
  }, [mapBounds, mapView.mapOptions, activeTileset])

  // useEffect(() => {
  //   // Always ensure that the choropleth has a data source
  //   if (
  //     !!report.layers.length &&
  //     !report.displayOptions?.dataVisualisation?.dataSource
  //   ) {
  //     const layerPreferrablyNotAreaStat = report.layers.slice().sort((a, b) => {
  //       if (a.sourceData.dataType === DataSourceType.AreaStats) return 1
  //       if (b.sourceData.dataType === DataSourceType.AreaStats) return -1
  //       return 0
  //     })[0]

  //     updateReport((draft) => {
  //       draft.displayOptions.dataVisualisation.dataSource =
  //         layerPreferrablyNotAreaStat.source
  //     })
  //   }
  // }, [report.layers.map((l) => l.id)])

  // useEffect(() => {
  //   // When a data source is picked, ensure the field is something workable
  //   if (
  //     report.displayOptions?.dataVisualisation?.dataSource &&
  //     !report.displayOptions?.dataVisualisation?.dataSourceField
  //   ) {
  //     const layer = report.layers.find(
  //       (l) =>
  //         l.source === report.displayOptions.dataVisualisation.dataSource &&
  //         !!l.sourceData.fieldDefinitions?.length
  //     )
  //     if (
  //       layer &&
  //       // I.e. it's about aggregation, not about counting
  //       layer.sourceData.dataType === DataSourceType.AreaStats
  //       // TODO: add config option for "count of points" to make this explicit
  //     ) {
  //       const idField = layer.sourceData.idField
  //       const field = layer.sourceData.fieldDefinitions?.filter(
  //         (f) => f.value !== idField
  //       )[0].value
  //       if (field) {
  //         updateReport((draft) => {
  //           draft.displayOptions.dataVisualisation.dataSourceField =
  //             layer.sourceData.fieldDefinitions?.[0].value
  //         })
  //       }
  //     }
  //   }
  // }, [report.layers.map((l) => l.id)])

  // useEffect(() => {
  //   // If the layer has been deleted, remove it from the choropleth
  //   const sourceIds = report.layers.map((l) => l.source)
  //   const choroplethSourceId =
  //     report.displayOptions?.dataVisualisation?.dataSource
  //   if (choroplethSourceId && !sourceIds.includes(choroplethSourceId)) {
  //     updateReport((draft) => {
  //       draft.displayOptions.dataVisualisation.dataSource = undefined
  //       draft.displayOptions.dataVisualisation.dataSourceField = undefined
  //     })
  //   }
  // }, [report.layers.map((l) => l.id)])

  return (
    <>
      <div className="absolute w-[-webkit-fill-available] h-full flex flex-row pointer-events-none">
        <div className="w-full h-full pointer-events-auto">
          {/* {loading && (
            <div className="absolute bottom-12 right-0 z-10 p-4">
              <LoadingIcon size={'50'} />
            </div>
          )} */}
          <LocalisedMap
            showStreetDetails={mapView.mapOptions.display.streetDetails}
            initViewCountry="uk"
            mapKey={mapView.id}
          >
            <PlaceholderLayer id={PLACEHOLDER_LAYER_ID_CHOROPLETH} />
            {tilesets && tilesets.length && boundaryType && (
              <PoliticalChoropleths
                key={`${boundaryType}-${tilesets[0].mapboxSourceId}`}
                mapOptions={mapView.mapOptions}
                boundaryType={boundaryType}
                tilesets={tilesets}
              />
            )}
            <PlaceholderLayer id={PLACEHOLDER_LAYER_ID_MARKERS} />
            <ReportMapMarkers />
          </LocalisedMap>
        </div>
      </div>
      <span className="pointer-events-auto">
        <ReportMapChoroplethLegend mapOptions={mapView.mapOptions} />
      </span>
    </>
  )
}
