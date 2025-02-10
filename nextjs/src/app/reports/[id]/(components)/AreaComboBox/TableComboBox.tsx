'use client'

import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import toSpaceCase from 'to-space-case'
import { SpecificViewConfig, ViewType } from '../../reportContext'
import { useTableDataByBoundary } from '../../useDataByBoundary'
import { AreaComboBox } from './AreaComboBox'

export default function TableComboBox() {
  const report = useReport()
  const view = useView(ViewType.Table)
  const tableView = view.currentViewOfType

  return tableView ? <TableComboBoxWithData view={tableView} /> : null
}

function TableComboBoxWithData({
  view,
}: {
  view: SpecificViewConfig<ViewType.Table>
}) {
  const { data } = useTableDataByBoundary(view)
  const areasByGss = data?.statistics?.reduce<
    Record<string, { gss: string; name: string }>
  >((areas, groupedData) => {
    const { gss, label } = groupedData
    if (!gss || !label) {
      return areas
    }
    areas[gss] = { gss, name: label }
    return areas
  }, {})
  const areas = Object.values(areasByGss || {})

  return (
    <AreaComboBox
      areas={areas}
      selectedBoundaryLabel={toSpaceCase(view.tableOptions.groupBy.area)}
    />
  )
}
