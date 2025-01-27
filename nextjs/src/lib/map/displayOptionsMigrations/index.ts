import { MapReportExtended, ViewType } from '@/app/reports/[id]/reportContext'
import { produce } from 'immer'

export function cleanUpLayerReferences(__report: MapReportExtended) {
  return produce(__report, (draft) => {
    // Remove any layer references that don't exist
    const layerIds = draft.layers.map((l) => l.id)
    // check areaExplorer
    draft.displayOptions.areaExplorer.displays = Object.fromEntries(
      Object.entries(draft.displayOptions.areaExplorer.displays).filter(
        ([k, v]) => (v.layerId ? layerIds.includes(v.layerId) : true)
      )
    )
    for (const view of Object.values(draft.displayOptions.views)) {
      if (view.type === ViewType.Map) {
        // check views with mapOptions with layers configured
        view.mapOptions.layers = Object.fromEntries(
          Object.entries(view.mapOptions.layers).filter(([k, v]) =>
            v.layerId ? layerIds.includes(v.layerId) : true
          )
        )
        // check choropleth layerId
        if (view.mapOptions.choropleth?.layerId) {
          if (!layerIds.includes(view.mapOptions.choropleth.layerId)) {
            delete view.mapOptions.choropleth.layerId
            delete view.mapOptions.choropleth.field
            delete view.mapOptions.choropleth.formula
          }
        }
      }
    }
  })
}
