import {
  mapChoroplethOptionsSchema,
  MapReportWithTypedJSON,
  ViewType,
} from '@/app/reports/[id]/reportContext'
import { produce } from 'immer'

export function cleanUpLayerReferences(migratedReport: MapReportWithTypedJSON) {
  return produce(migratedReport, (draft) => {
    // 1. Check that report layer IDs and references are synced up
    const layerIds = draft.layers.map((l) => l.id)
    // 1.1. Area explorer layers
    draft.displayOptions.areaExplorer.displays = Object.fromEntries(
      Object.entries(draft.displayOptions.areaExplorer.displays).filter(
        ([k, v]) => (v.layerId ? layerIds.includes(v.layerId) : true)
      )
    )
    // 1.2. View layers
    for (const viewId of Object.keys(draft.displayOptions.views)) {
      if (draft.displayOptions.views[viewId].type === ViewType.Map) {
        // check views with mapOptions with layers configured
        draft.displayOptions.views[viewId].mapOptions.layers =
          Object.fromEntries(
            Object.entries(
              draft.displayOptions.views[viewId].mapOptions.layers
            ).filter(([k, v]) =>
              v.layerId ? layerIds.includes(v.layerId) : true
            )
          )
        // check choropleth layerId
        if (
          draft.displayOptions.views[viewId].mapOptions.choropleth
            ?.advancedStatisticsConfig?.sourceIds?.length &&
          // Not all sourceIds are present in the report layer
          !draft.displayOptions.views[
            viewId
          ].mapOptions.choropleth?.advancedStatisticsConfig.sourceIds.every(
            (sourceId) => draft.layers.some((l) => l.source === sourceId)
          )
        ) {
          draft.displayOptions.views[viewId].mapOptions.choropleth =
            mapChoroplethOptionsSchema.parse({})
        }
      }
    }
  })
}
