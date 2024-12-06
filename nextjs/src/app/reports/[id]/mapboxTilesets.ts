import { AnalyticalAreaType } from '@/__generated__/graphql'
import { Tileset } from './types'

type AvailableCountries = 'uk'

const uk: [AnalyticalAreaType, Tileset][] = [
  [
    AnalyticalAreaType.AdminWard,
    {
      name: 'Wards',
      singular: 'ward',
      mapboxSourceId: 'commonknowledge.3s92t1yc',
      sourceLayerId: 'converted_uk_wards_2025',
      promoteId: 'WD24CD',
      labelId: 'WD24NM',
    },
  ],
  [
    AnalyticalAreaType.ParliamentaryConstituency_2024,
    {
      name: 'Constituencies',
      singular: 'constituency',
      mapboxSourceId: 'commonknowledge.bhg1h3hj',
      sourceLayerId: 'uk_cons_2025',
      promoteId: 'gss_code',
      labelId: 'name',
    },
  ],
  // [AnalyticalAreaType.LocalAuthorityDistrict]: {
  //   name: '',
  //   singular: '',
  //   mapboxSourceId: '',
  //   sourceLayerId: '',
  //   promoteId: '',
  //   labelId: '',
  // },
]

export function getTilesetsByCountry(
  country: AvailableCountries
): [AnalyticalAreaType, Tileset][] {
  switch (country) {
    case 'uk':
      return uk
    default:
      return []
  }
}
