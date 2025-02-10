import {
  mapChoroplethOptionsSchema,
  MapReportWithTypedJSON,
  mapViewSchema,
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
        // Add a type assertion to the mapOptions, in case this helps nextjs build
        const mapView = mapViewSchema.parse(draft.displayOptions.views[viewId])
        // @ts-ignore — due to weird nextjs build error "Type error: Property 'mapOptions' does not exist on type 'WritableDraft<...>"
        draft.displayOptions.views[viewId].mapOptions.layers =
          Object.fromEntries(
            Object.entries(
              // @ts-ignore — due to weird nextjs build error "Type error: Property 'mapOptions' does not exist on type 'WritableDraft<...>"
              draft.displayOptions.views[viewId].mapOptions.layers
            ).filter(([k, v]) =>
              // @ts-ignore — due to weird nextjs build error "'v' is of type 'unknown'."
              v.layerId ? layerIds.includes(v.layerId) : true
            )
          )
        // check choropleth layerId
        if (
          // @ts-ignore — due to weird nextjs build error "Type error: Property 'mapOptions' does not exist on type 'WritableDraft<...>"
          mapView.mapOptions.choropleth?.advancedStatisticsConfig?.sourceIds
            ?.length &&
          // Not all sourceIds are present in the report layer
          // @ts-ignore — due to weird nextjs build error "Type error: Property 'mapOptions' does not exist on type 'WritableDraft<...>"
          !mapView.mapOptions.choropleth?.advancedStatisticsConfig.sourceIds.every(
            (sourceId: string) =>
              draft.layers.some((l) => l.source === sourceId)
          )
        ) {
          // @ts-ignore — due to weird nextjs build error "Type error: Property 'mapOptions' does not exist on type 'WritableDraft<...>"
          draft.displayOptions.views[viewId].mapOptions.choropleth =
            mapChoroplethOptionsSchema.parse({})
        }
      }
    }
  })
}
