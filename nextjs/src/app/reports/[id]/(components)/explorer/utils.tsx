import { ExplorerState } from '@/lib/map'
import queryString from 'query-string'

export function exploreArea(gss: string) {
  const params = {
    entity: 'area',
    id: gss,
    showExplorer: true,
  } satisfies ExplorerState

  window.location.search = queryString.stringify(params)
}

export function exploreRecord(id: string) {
  const params = {
    entity: 'record',
    id,
    showExplorer: true,
  } satisfies ExplorerState

  window.location.search = queryString.stringify(params)
}
