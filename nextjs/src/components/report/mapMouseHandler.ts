import { EXTERNAL_DATA_SOURCE_MAPBOX_SOURCE_ID_PREFIX } from '@/app/reports/[id]/(components)/MembersListPointMarkers'
import { ReportContextProps } from '@/app/reports/[id]/reportContext'
import { ExplorerSuite } from '@/lib/map'
import { MapMouseEvent } from 'mapbox-gl'

export const mapMouseHandler =
  (report: ReportContextProps, explorer: ExplorerSuite) =>
  (e: MapMouseEvent) => {
    // Handle clicking at the top level, because each individual click handler doesn't take into account that the click might be caught by the other one
    const features = e.target.queryRenderedFeatures(e.point)

    // console.log('Clicked on map', features)

    // First, try to find a point source feature
    const pointSourceFeatures = features.filter((f) =>
      f.source?.includes(EXTERNAL_DATA_SOURCE_MAPBOX_SOURCE_ID_PREFIX)
    )

    const selectedRecord =
      explorer.state.entity === 'record' ? explorer.state.id : null

    for (const feature of pointSourceFeatures) {
      if (feature.properties?.id) {
        if (selectedRecord === feature.properties?.id) {
          explorer.clear()
          // console.log('Deselected point source feature', feature)
          return
        } else {
          explorer.select(
            {
              entity: 'record',
              id: feature.properties?.id,
              showExplorer: true,
            },
            {
              // Don't pan the map because the user's already
              // looking at the point source feature
              // and that'd be a jarring UX
              bringIntoView: false,
            }
          )
          // If that worked, we're done
          // console.log('Clicked on point source feature', feature)
          return
        }
      }
    }

    // If we didn't find a point source feature, try to find an area source feature
    const areaSourceFeatures = features.filter(
      (f) => !pointSourceFeatures.map((f) => f.source).includes(f.source)
    )

    const selectedBoundary =
      explorer.state.entity === 'area' ? explorer.state.id : null

    for (const feature of areaSourceFeatures) {
      // Handle area click
      const id = feature.id?.toString()
      if (id) {
        // If already selected boundary, deselect it
        if (selectedBoundary === id) {
          explorer.clear()
          // console.log('Deselected area', feature)
          return
        } else {
          explorer.select(
            { entity: 'area', id, showExplorer: true },
            {
              // Don't pan the map because the user's already
              // looking at the point source feature
              // and that'd be a jarring UX
              bringIntoView: false,
            }
          )
          // console.log('Selected area', feature)
          return
        }
      }
    }

    // console.log("Didn't find a feature to click on", features)
  }
