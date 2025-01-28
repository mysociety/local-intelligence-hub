import {
  AnalyticalAreaType,
  ChoroplethMode,
  SourceStatsByBoundaryQuery,
  SourceStatsByBoundaryQueryVariables,
} from '@/__generated__/graphql'
import { useReport } from '@/lib/map/useReport'
import { useQuery } from '@apollo/client'
import { SpecificViewConfig, ViewType } from '../reportContext'
import { CHOROPLETH_STATS_FOR_SOURCE } from '../useDataByBoundary'

export function TableView({
  tableView,
}: {
  tableView: SpecificViewConfig<ViewType.Table>
}) {
  const report = useReport()
  const data = useDataByBoundary(report.report.layers[2].source)
  return <pre>{JSON.stringify(data.data, null, 2)}</pre>
}

const useDataByBoundary = (sourceId: string) => {
  return useQuery<
    SourceStatsByBoundaryQuery,
    SourceStatsByBoundaryQueryVariables
  >(CHOROPLETH_STATS_FOR_SOURCE, {
    variables: {
      sourceId: sourceId!,
      analyticalAreaType: AnalyticalAreaType.ParliamentaryConstituency,
      mode: ChoroplethMode.Table,
    },
    notifyOnNetworkStatusChange: true, // required to mark loading: true on fetchMore()
  })
}
