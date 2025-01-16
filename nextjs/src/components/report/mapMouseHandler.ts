import { ReportContextProps } from '@/app/reports/[id]/reportContext'
import { ExplorerSuite } from '@/lib/map'
import { MapMouseEvent } from 'mapbox-gl'

export const mapMouseHandler =
  (
    report: ReportContextProps,
    [explorerState, setExplorerState]: ExplorerSuite
  ) =>
  (e: MapMouseEvent) => {
    // Handle clicking at the top level, because each individual click handler doesn't take into account that the click might be caught by the other one
    const features = e.target.queryRenderedFeatures(e.point)

    // console.log('Clicked on map', features)

    // First, try to find a point source feature
    const pointSourceFeatures = features.filter((f) =>
      report.report.layers.some((l) => {
        return l.source === f.source
      })
    )

    const selectedRecord =
      explorerState.entity === 'record' ? explorerState.id : null

    for (const feature of pointSourceFeatures) {
      if (feature.properties?.id) {
        if (selectedRecord === feature.properties?.id) {
          setExplorerState({
            entity: '',
            id: null,
            showExplorer: false,
          })
          // console.log('Deselected point source feature', feature)
          return
        } else {
          setExplorerState({
            entity: 'record',
            id: feature.properties?.id,
            showExplorer: true,
          })
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
      explorerState.entity === 'area' ? explorerState.id : null

    for (const feature of areaSourceFeatures) {
      // Handle area click
      const id = feature.id?.toString()
      if (id) {
        // If already selected boundary, deselect it
        if (selectedBoundary === id) {
          setExplorerState({
            entity: '',
            id: null,
            showExplorer: false,
          })
          // console.log('Deselected area', feature)
          return
        } else {
          setExplorerState({ entity: 'area', id, showExplorer: true })
          // console.log('Selected area', feature)
          return
        }
      }
    }

    // console.log("Didn't find a feature to click on", features)
  }
