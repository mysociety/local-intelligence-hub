'use client'

import { AnalyticalAreaType } from '@/__generated__/graphql'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import toSpaceCase from 'to-space-case'
import { ViewType } from '../../reportContext'
import { useDataByBoundaryForTable } from '../TableView'
import { AreaComboBox } from './AreaComboBox'

export default function TableComboBox() {
  const report = useReport()
  const view = useView(ViewType.Table)
  const tableView = view.currentViewOfType
  const sourceId = report.getLayer(tableView?.tableOptions.layerId)?.source

  return tableView && sourceId ? (
    <TableComboBoxWithData
      sourceId={sourceId}
      analyticalAreaType={tableView.tableOptions.groupBy.area}
    />
  ) : null
}

function TableComboBoxWithData({
  sourceId,
  analyticalAreaType,
}: {
  sourceId: string
  analyticalAreaType: AnalyticalAreaType
}) {
  const { data } = useDataByBoundaryForTable(sourceId, analyticalAreaType)
  const areasByGss = data?.choroplethDataForSource.reduce(
    (areas, groupedData) => {
      const { gss, label } = groupedData
      if (!gss || !label) {
        return areas
      }
      areas[gss] = { gss, name: label }
      return areas
    },
    {} as Record<string, { gss: string; name: string }>
  )
  const areas = Object.values(areasByGss || {})

  return (
    <AreaComboBox
      areas={areas}
      selectedBoundaryLabel={toSpaceCase(analyticalAreaType)}
    />
  )
}
