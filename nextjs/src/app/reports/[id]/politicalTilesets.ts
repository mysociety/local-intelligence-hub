import { AnalyticalAreaType } from '@/__generated__/graphql'
import { Tileset } from './types'

type AvailableCountries = 'uk'

export type PoliticalTileset = {
  boundaryType: AnalyticalAreaType
  label: string
  tileset: Tileset
}

const uk: PoliticalTileset[] = [
  {
    boundaryType: AnalyticalAreaType.ParliamentaryConstituency_2024,
    label: 'Parliamentary Constituencies',
    tileset: {
      name: 'Constituencies',
      singular: 'constituency',
      mapboxSourceId: 'commonknowledge.bhg1h3hj',
      sourceLayerId: 'uk_cons_2025',
      promoteId: 'gss_code',
      labelId: 'name',
    },
  },
  {
    boundaryType: AnalyticalAreaType.AdminWard,
    label: 'Wards',
    tileset: {
      name: 'Wards',
      singular: 'ward',
      mapboxSourceId: 'commonknowledge.3s92t1yc',
      sourceLayerId: 'converted_uk_wards_2025',
      promoteId: 'WD24CD',
      labelId: 'WD24NM',
    },
  },
  // {
  //   boundaryType: AnalyticalAreaType.Country,
  //   label: 'Countries',
  //   tileset: {
  //     name: 'Countries',
  //     singular: 'country',
  //     mapboxSourceId: 'commonknowledge.48bu0oj9',
  //     sourceLayerId: 'converted_uk_countries_2023',
  //     promoteId: 'CTRY23CD',
  //     labelId: 'CTRY23NM',
  //   },
  // },
  {
    boundaryType: AnalyticalAreaType.EuropeanElectoralRegion,
    label: 'European Electoral Regions',
    tileset: {
      name: 'European Electoral Regions',
      singular: 'European Electoral Region',
      mapboxSourceId: 'commonknowledge.awsfhx20',
      sourceLayerId: 'European_Electoral_Regions_De-bxyqod',
      promoteId: 'eer18cd',
      labelId: 'eer18nm',
    },
  },
  {
    boundaryType: AnalyticalAreaType.AdminDistrict,
    label: 'Local Authority Districts',
    tileset: {
      name: 'Local Authority Districts',
      singular: 'Local Authority District',
      mapboxSourceId: 'commonknowledge.2p1squ75',
      sourceLayerId: 'lads_2023geo',
      promoteId: 'LAD23CD',
      labelId: 'LAD23NM',
    },
  },
]

export const POLITICAL_BOUNDARIES = uk

export function getPoliticalTilesetsByCountry(
  country: AvailableCountries
): PoliticalTileset[] {
  switch (country) {
    case 'uk':
      return uk
    default:
      return []
  }
}
