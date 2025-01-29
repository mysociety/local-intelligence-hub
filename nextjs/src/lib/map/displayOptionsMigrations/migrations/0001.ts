import { AreaQueryMode, GetMapReportQuery } from '@/__generated__/graphql'
import {
  IDisplayOptions,
  IExplorerDisplay,
  SpecificViewConfig,
  ViewType,
  explorerDisplaySchema,
  mapLayerSchema,
} from '@/app/reports/[id]/reportContext'
import { InspectorDisplayType } from '@/lib/explorer'
import { produce } from 'immer'
import { v4 } from 'uuid'

export const VERSION = '20250125'

function starId(starredState: any): string {
  return `ENTITY:${starredState.entity}::ID:${starredState.id}`
}

/**
 * Move dataVisualisation and display to views[0].mapOptions.
 */
export function migration0001(
  unmigratedReport: GetMapReportQuery['mapReport']
) {
  return produce(unmigratedReport, (draft) => {
    // Move dataVisualisation and display to views[0].mapOptions
    const viewId = v4()
    const newDisplayOptions = {
      version: VERSION,
      starred: unmigratedReport.displayOptions.starred.reduce(
        (acc: any, star: any) => {
          acc[starId(star)] = star
          return acc
        },
        {} as Record<string, IDisplayOptions['starred'][0]>
      ),
      areaExplorer: {
        displays: unmigratedReport.layers.reduce(
          (acc: any, layer: any) => {
            const id = v4()
            acc[id] = explorerDisplaySchema.parse({
              id,
              layerId: layer.id,
              displayType:
                (layer.inspectorType as InspectorDisplayType) ||
                InspectorDisplayType.Properties,
              areaQueryMode: AreaQueryMode.Overlapping,
            }) satisfies IExplorerDisplay
            return acc
          },
          {} as Record<string, IDisplayOptions['areaExplorer']['displays'][0]>
        ),
      },
      views: {
        [viewId]: {
          id: viewId,
          type: ViewType.Map,
          mapOptions: {
            choropleth: {
              boundaryType:
                unmigratedReport.displayOptions.dataVisualisation.boundaryType,
              palette:
                unmigratedReport.displayOptions.dataVisualisation.palette,
              isPaletteReversed:
                unmigratedReport.displayOptions.dataVisualisation
                  .paletteReversed,
              layerId: unmigratedReport.layers.find(
                (l: any) =>
                  l.source ===
                  unmigratedReport.displayOptions.dataVisualisation.dataSource
              )?.id,
              field:
                unmigratedReport.displayOptions.dataVisualisation
                  .dataSourceField,
              mode: unmigratedReport.displayOptions.dataVisualisation
                .choroplethMode,
              formula:
                unmigratedReport.displayOptions.dataVisualisation.formula,
            },
            display: {
              choropleth:
                unmigratedReport.displayOptions.display.showDataVisualisation,
              borders: unmigratedReport.displayOptions.display.showBorders,
              streetDetails:
                unmigratedReport.displayOptions.display.showStreetDetails,
              boundaryNames:
                unmigratedReport.displayOptions.display.showBoundaryNames,
            },
            layers: unmigratedReport.layers?.reduce(
              (acc: any, layer: any) => {
                const id = v4()
                const colour = layer.mapboxPaint?.['circle-color'] || undefined
                acc[id] = mapLayerSchema.parse({
                  id,
                  layerId: layer.id,
                  colour,
                })
                return acc
              },
              {} as Record<
                string,
                SpecificViewConfig<ViewType.Map>['mapOptions']['layers'][0]
              >
            ),
          },
        },
      },
    }
    draft.displayOptions = newDisplayOptions
  })
}
