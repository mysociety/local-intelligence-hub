import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import {
  LucideBoxSelect,
  LucideMap,
  LucidePaintbrush,
  LucideType,
} from 'lucide-react'
import { POLITICAL_BOUNDARIES } from '../politicalTilesets'
import { ViewType } from '../reportContext'
import { AddMapLayerButton } from './AddDataSourceButton'
import DataSourcesList from './DataSourcesList'
import { EditorSelect } from './EditorSelect'
import { EditorSwitch } from './EditorSwitch'

export function ReportDataSources() {
  const { addLayer } = useReport()
  const mapView = useView(ViewType.Map)

  return (
    <div className="space-y-8 py-4">
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-sm">Data sources</h2>
        <DataSourcesList />
        <div className="flex gap-2 items-center mt-1">
          <AddMapLayerButton addLayer={addLayer} />
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-sm">Base layers</h2>

        <EditorSwitch
          label={
            <span className="flex flex-row items-center gap-1 w-full">
              <LucidePaintbrush className="w-5 h-5 text-meepGray-400" />
              <span className="text-white">Choropleth</span>
            </span>
          }
          labelClassName="text-white"
          value={mapView.currentView?.mapOptions?.display.choropleth}
          onChange={(checked) => {
            mapView.updateView((draft) => {
              draft.mapOptions.display.choropleth = checked
            })
          }}
        />

        <EditorSwitch
          label={
            <span className="flex flex-row items-center gap-1 w-full">
              <LucideType className="w-5 h-5 text-meepGray-400" />
              <span className="text-white">Place labels</span>
            </span>
          }
          labelClassName="text-white"
          value={mapView.currentView?.mapOptions?.display.boundaryNames}
          onChange={(showBoundaryNames: boolean) => {
            mapView.updateView((draft) => {
              draft.mapOptions.display.boundaryNames = showBoundaryNames
            })
          }}
        />

        <EditorSwitch
          label={
            <span className="flex flex-row items-center gap-1 w-full">
              <LucideBoxSelect className="w-5 h-5 text-meepGray-400" />
              <span className="text-white">Borders</span>
            </span>
          }
          labelClassName="text-white"
          value={mapView.currentView?.mapOptions?.display.borders}
          onChange={(showBorders: boolean) => {
            mapView.updateView((draft) => {
              draft.mapOptions.display.borders = showBorders
            })
          }}
        />

        <EditorSelect
          className="-my-2"
          label={
            <span className="flex flex-row items-center gap-1 w-full">
              <LucideBoxSelect className="w-5 h-5 text-meepGray-400" />
              <span className="text-white">Border type</span>
            </span>
          }
          value={mapView.currentView?.mapOptions?.choropleth.boundaryType}
          options={POLITICAL_BOUNDARIES.map((boundary) => ({
            label: boundary.label,
            value: boundary.boundaryType,
          }))}
          onChange={(d) => {
            mapView.updateView((draft) => {
              // console.log({ draft })
              // draft.mapOptions.choropleth.boundaryType = d as BoundaryType
            })
          }}
        />

        <EditorSwitch
          label={
            <span className="flex flex-row items-center gap-1 w-full">
              <LucideMap className="w-5 h-5 text-meepGray-400" />
              <span className="text-white">Street details</span>
            </span>
          }
          labelClassName="text-white"
          value={mapView.currentView?.mapOptions?.display.streetDetails}
          onChange={(showStreetDetails: boolean) => {
            mapView.updateView((draft) => {
              draft.mapOptions.display.streetDetails = showStreetDetails
            })
          }}
        />
      </section>
    </div>
  )
}
