import { MapBounds } from '@/__generated__/graphql'
import {
  MapLoader,
  useActiveTileset,
  useExplorerState,
  useLoadedMap,
  useMapBounds,
} from '@/lib/map'
import { debounce } from 'lodash'
import { FillLayerSpecification } from 'mapbox-gl'
import React, { Fragment, useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import { addCountByGssToMapboxLayer } from '../../addCountByGssToMapboxLayer'
import {
  getAreaCountLayout,
  getAreaGeoJSON,
  getAreaLabelLayout,
  getChoroplethEdge,
  getChoroplethFill,
  getSelectedChoroplethEdge,
} from '../../mapboxStyles'
import { BoundaryType } from '../../politicalTilesets'
import { MapReportExtended } from '../../reportContext'
import { Tileset } from '../../types'
import useDataByBoundary from '../../useDataByBoundary'
import useHoverOverBoundaryEvents from '../../useSelectBoundary'
import { PLACEHOLDER_LAYER_ID_CHOROPLETH } from '../ReportPage'

interface PoliticalChoroplethsProps {
  tilesets: Tileset[]
  report: MapReportExtended
  boundaryType: BoundaryType
}

const PoliticalChoropleths: React.FC<PoliticalChoroplethsProps> = ({
  report,
  boundaryType,
  tilesets,
}) => {
  // Show the layer only if the report is set to show the boundary type and the VisualisationType is choropleth
  const borderVisibility = report.displayOptions?.display.showBorders
    ? 'visible'
    : 'none'
  const shaderVisibility =
    report.displayOptions?.dataVisualisation?.boundaryType === boundaryType &&
    report.displayOptions?.display?.showDataVisualisation
      ? 'visible'
      : 'none'

  // Store the choropleth fills when they are calculated for a layer
  // to avoid flicker when zooming in and out.
  const [fillsByLayer, setFillsByLayer] = useState<
    Record<string, FillLayerSpecification['paint']>
  >({})

  const { activeTileset, setActiveTileset } = useActiveTileset(boundaryType)
  const { data } = useDataByBoundary({
    report,
    tileset: activeTileset,
  })
  const dataByBoundary = data?.choroplethDataForSource || []

  const boundaryNameVisibility =
    shaderVisibility === 'visible' &&
    report.displayOptions?.display.showBoundaryNames
      ? 'visible'
      : 'none'

  const areasVisible =
    borderVisibility === 'visible' || shaderVisibility === 'visible'
      ? 'visible'
      : 'none'

  const map = useLoadedMap()
  const [explorer, setExplorer] = useExplorerState()
  useHoverOverBoundaryEvents(areasVisible === 'visible' ? activeTileset : null)

  // Update map bounds and active tileset on pan/zoom
  const [, setMapBounds] = useMapBounds()
  useEffect(() => {
    const onMoveEnd = debounce(() => {
      const zoom = map.loadedMap?.getZoom() || 0
      const tileset = tilesets.filter(
        (t) => zoom >= t.minZoom && zoom <= t.maxZoom
      )[0]
      setActiveTileset(tileset)
      setMapBounds(getMapBounds(map))
    }, 500)
    if (tilesets.length > 0 && map.loadedMap) {
      map.loadedMap.on('moveend', onMoveEnd)
    }
    return () => {
      map.loadedMap?.off('moveend', onMoveEnd)
    }
  }, [map.loaded, tilesets])

  // When the map is loaded and we have the data, add the data to the boundaries
  useEffect(() => {
    if (map.loaded && dataByBoundary) {
      addCountByGssToMapboxLayer(
        dataByBoundary,
        activeTileset.mapboxSourceId,
        activeTileset.sourceLayerId,
        map.loadedMap
      )
      // Calculate the choropleth fill for the layer and store it,
      // to reduce flicker when zooming between layers
      const fill = getChoroplethFill(
        dataByBoundary,
        report.displayOptions,
        shaderVisibility === 'visible'
      )
      setFillsByLayer({ ...fillsByLayer, [activeTileset.mapboxSourceId]: fill })
    }
  }, [map.loaded, activeTileset, data, report])

  if (!map.loaded) return null
  if (!data || !tilesets) return null

  return (
    <>
      {tilesets.map((tileset) => (
        <Fragment key={tileset.mapboxSourceId}>
          <Source
            id={tileset.mapboxSourceId}
            type="vector"
            url={`mapbox://${tileset.mapboxSourceId}`}
            promoteId={tileset.promoteId}
            minzoom={tileset.minZoom}
            maxzoom={tileset.maxZoom}
          >
            {/* Fill of the boundary */}

            <>
              <Layer
                beforeId="road-simple"
                id={`${tileset.mapboxSourceId}-fill`}
                source={tileset.mapboxSourceId}
                source-layer={tileset.sourceLayerId}
                type="fill"
                paint={fillsByLayer[tileset.mapboxSourceId] || {}}
                minzoom={tileset.minZoom}
                maxzoom={tileset.maxZoom}
              />
            </>

            {/* Border of the boundary */}
            <Layer
              beforeId={PLACEHOLDER_LAYER_ID_CHOROPLETH}
              id={`${tileset.mapboxSourceId}-line`}
              source={tileset.mapboxSourceId}
              source-layer={tileset.sourceLayerId}
              type="line"
              paint={getChoroplethEdge(borderVisibility === 'visible')}
              layout={{
                'line-join': 'round',
                'line-round-limit': 0.1,
              }}
              minzoom={tileset.minZoom}
              maxzoom={tileset.maxZoom}
            />
            {/* Border of the selected boundary  */}
            <Layer
              beforeId={PLACEHOLDER_LAYER_ID_CHOROPLETH}
              id={`${tileset.mapboxSourceId}-selected`}
              source={tileset.mapboxSourceId}
              source-layer={tileset.sourceLayerId}
              type="line"
              paint={getSelectedChoroplethEdge()}
              filter={[
                '==',
                ['get', tileset.promoteId],
                explorer.entity === 'area'
                  ? explorer.id
                  : 'sOmE iMpOsSiBle iD tHaT wIlL uPdAtE mApBoX',
              ]}
              layout={{
                visibility: areasVisible,
                'line-join': 'round',
                'line-round-limit': 0.1,
              }}
            />
          </Source>

          <Source
            id={`${tileset.mapboxSourceId}-area-count`}
            type="geojson"
            data={getAreaGeoJSON(dataByBoundary)}
            minzoom={tileset.minZoom}
            maxzoom={tileset.maxZoom}
          >
            <Layer
              id={`${tileset.mapboxSourceId}-area-count`}
              type="symbol"
              layout={{
                ...getAreaCountLayout(dataByBoundary),
                visibility: boundaryNameVisibility,
              }}
              paint={{
                'text-opacity': [
                  'interpolate',
                  ['exponential', 1],
                  ['zoom'],
                  7.5,
                  0,
                  7.8,
                  1,
                ],
                'text-color': 'white',
                'text-halo-color': '#24262b',
                'text-halo-width': 1.5,
              }}
              minzoom={tileset.minZoom}
              maxzoom={tileset.maxZoom}
            />

            <Layer
              id={`${tileset.mapboxSourceId}-area-label`}
              type="symbol"
              layout={{
                ...getAreaLabelLayout(dataByBoundary),
                visibility: boundaryNameVisibility,
              }}
              paint={{
                'text-color': 'white',
                'text-opacity': [
                  'interpolate',
                  ['exponential', 1],
                  ['zoom'],
                  7.5,
                  0,
                  7.8,
                  1,
                ],
                'text-halo-color': '#24262b',
                'text-halo-width': 1.5,
              }}
              minzoom={tileset.minZoom}
              maxzoom={tileset.maxZoom}
            />
          </Source>
        </Fragment>
      ))}
    </>
  )
}

const getMapBounds = (map: MapLoader): MapBounds | null => {
  if (!map.loadedMap) {
    return null
  }
  const mapBounds = map.loadedMap.getBounds()
  if (!mapBounds) {
    return null
  }
  return {
    west: mapBounds.getWest(),
    east: mapBounds.getEast(),
    north: mapBounds.getNorth(),
    south: mapBounds.getSouth(),
  }
}

export default PoliticalChoropleths
