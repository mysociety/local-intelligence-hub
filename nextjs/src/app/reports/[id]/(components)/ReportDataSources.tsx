import { AddMapLayerButton } from '@/components/report/AddMapLayerButton'
import useDataSources from '../useDataSources'
import CollapsibleSection from './CollapsibleSection'
import DataSourcesList from './DataSourcesList'

export function ReportDataSources() {
  const { addDataSource } = useDataSources()
  return (
    <div className="flex flex-col gap-2">
      <CollapsibleSection id="report-data-sources" title="Data Sources">
        <p className="text-meepGray-300 text-sm mb-3 font-normal">
          Connect your own custom data sources or select data sources from our
          library.
        </p>
        <DataSourcesList />
        <div className="flex gap-2 items-center mt-1">
          <AddMapLayerButton addLayer={addDataSource} />
        </div>
      </CollapsibleSection>
    </div>
  )
}
