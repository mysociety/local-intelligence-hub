import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import { ViewType } from '../reportContext'
import { AddMapLayerButton } from './AddDataSourceButton'
import DataSourcesList from './DataSourcesList'

export function ReportDataSources() {
  const { addLayer } = useReport()
  const mapView = useView(ViewType.Map)

  return (
    <div className="space-y-8 py-4">
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-white text-sm">Data layers</h2>
        <DataSourcesList />
        <div className="flex gap-2 items-center mt-1">
          <AddMapLayerButton addLayer={addLayer} />
        </div>
      </section>
    </div>
  )
}
