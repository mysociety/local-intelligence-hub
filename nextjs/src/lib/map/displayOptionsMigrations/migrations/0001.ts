import {
  IDisplayOptions,
  IExplorerDisplay,
  SpecificViewConfig,
  ViewType,
} from '@/app/reports/[id]/reportContext'
import { InspectorDisplayType } from '@/lib/explorer'
import { produce } from 'immer'
import { v4 } from 'uuid'

export const VERSION = '20250125'

function starId(starredState: any): string {
  return `ENTITY:${starredState.entity}::ID:${starredState.id}`
}

export function migration0001(oldReport: any) {
  return produce(oldReport, (draft: any) => {
    // Move dataVisualisation and display to views[0].mapOptions
    const viewId = v4()
    draft = {
      version: VERSION,
      starred: oldReport.displayOptions.starred.reduce(
        (acc: any, star: any) => {
          acc[starId(star)] = star
          return acc
        },
        {} as Record<string, IDisplayOptions['starred'][0]>
      ),
      areaExplorer: {
        displays: oldReport.layers.reduce(
          (acc: any, layer: any) => {
            const id = v4()
            acc[id] = {
              id,
              layerId: layer.id,
              displayType: layer.inspectorType as InspectorDisplayType,
            } satisfies IExplorerDisplay
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
                oldReport.displayOptions.dataVisualisation.boundaryType,
              palette: oldReport.displayOptions.dataVisualisation.palette,
              isPaletteReversed:
                oldReport.displayOptions.dataVisualisation.paletteReversed,
              layerId: oldReport.layers.find(
                (l: any) =>
                  l.source ===
                  oldReport.displayOptions.dataVisualisation.dataSource
              )?.id,
              field: oldReport.displayOptions.dataVisualisation.dataSourceField,
              mode: oldReport.displayOptions.dataVisualisation.choroplethMode,
              formula: oldReport.displayOptions.dataVisualisation.formula,
            },
            display: {
              choropleth:
                oldReport.displayOptions.display.showDataVisualisation,
              borders: oldReport.displayOptions.display.showBorders,
              streetDetails: oldReport.displayOptions.display.showStreetDetails,
              boundaryNames: oldReport.displayOptions.display.showBoundaryNames,
            },
            layers: oldReport.layers.reduce(
              (acc: any, layer: any) => {
                const id = v4()
                acc[id] = {
                  id,
                  layerId: layer.id,
                  colour: layer.mapboxPaint?.['circle-color'],
                }
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
    return draft
  })
}
