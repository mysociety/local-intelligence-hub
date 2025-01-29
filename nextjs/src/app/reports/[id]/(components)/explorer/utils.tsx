import { ExplorerState } from '@/lib/map/useExplorer'
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

export function formatPostalAddresses(postalAddresses: any[]): string[] {
  if (!Array.isArray(postalAddresses)) return []

  return postalAddresses.map((address) => {
    const formattedAddress = [
      ...(address.address_lines || []),
      address.locality?.trim(),
      address.postal_code,
    ]
      .filter(Boolean)
      .join('\n')

    return formattedAddress
  })
}
