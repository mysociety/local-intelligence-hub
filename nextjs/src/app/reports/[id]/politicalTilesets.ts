import { AnalyticalAreaType } from '@/__generated__/graphql'
import { Tileset } from './types'

type AvailableCountries = 'uk'

export enum BoundaryType {
  // values are the same as AnalyticalAreaType where possible
  // for back compatibility
  PARLIAMENTARY_CONSTITUENCIES = 'parliamentary_constituency_2024',
  WARDS = 'admin_ward',
  EUROPEAN_ELECTORAL_REGIONS = 'european_electoral_region',
  LOCAL_AUTHORITIES = 'admin_district',
  CENSUS_OUTPUT_AREAS = 'census_output_areas',
}

export type PoliticalTileset = {
  boundaryType: BoundaryType
  label: string
  tilesets: Tileset[]
}

const MAX_VALID_ZOOM = 24

const uk: PoliticalTileset[] = [
  {
    label: 'Parliamentary Constituencies',
    boundaryType: BoundaryType.PARLIAMENTARY_CONSTITUENCIES,
    tilesets: [
      {
        analyticalAreaType: AnalyticalAreaType.ParliamentaryConstituency_2024,
        name: 'Constituencies',
        singular: 'constituency',
        mapboxSourceId: 'commonknowledge.bhg1h3hj',
        sourceLayerId: 'uk_cons_2025',
        promoteId: 'gss_code',
        labelId: 'name',
        minZoom: 0,
        maxZoom: MAX_VALID_ZOOM,
      },
    ],
  },
  {
    label: 'Wards',
    boundaryType: BoundaryType.WARDS,
    tilesets: [
      {
        analyticalAreaType: AnalyticalAreaType.AdminWard,
        name: 'Wards',
        singular: 'ward',
        mapboxSourceId: 'commonknowledge.3s92t1yc',
        sourceLayerId: 'converted_uk_wards_2025',
        promoteId: 'WD24CD',
        labelId: 'WD24NM',
        minZoom: 0,
        maxZoom: MAX_VALID_ZOOM,
      },
    ],
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
    label: 'European Electoral Regions',
    boundaryType: BoundaryType.EUROPEAN_ELECTORAL_REGIONS,
    tilesets: [
      {
        analyticalAreaType: AnalyticalAreaType.EuropeanElectoralRegion,
        name: 'European Electoral Regions',
        singular: 'European Electoral Region',
        mapboxSourceId: 'commonknowledge.awsfhx20',
        sourceLayerId: 'European_Electoral_Regions_De-bxyqod',
        promoteId: 'eer18cd',
        labelId: 'eer18nm',
        minZoom: 0,
        maxZoom: MAX_VALID_ZOOM,
      },
    ],
  },
  {
    label: 'Local Authority Districts',
    boundaryType: BoundaryType.LOCAL_AUTHORITIES,
    tilesets: [
      {
        analyticalAreaType: AnalyticalAreaType.AdminDistrict,
        name: 'Local Authority Districts',
        singular: 'Local Authority District',
        mapboxSourceId: 'commonknowledge.2p1squ75',
        sourceLayerId: 'lads_2023geo',
        promoteId: 'LAD23CD',
        labelId: 'LAD23NM',
        minZoom: 0,
        maxZoom: MAX_VALID_ZOOM,
      },
    ],
  },
  {
    label: 'Census Output Areas',
    boundaryType: BoundaryType.CENSUS_OUTPUT_AREAS,
    tilesets: [
      {
        analyticalAreaType: AnalyticalAreaType.Msoa,
        name: 'Census MSOAs',
        singular: 'Census MSOA',
        mapboxSourceId: 'commonknowledge.bjml5p4d',
        sourceLayerId:
          'Middle_layer_Super_Output_Areas_December_2021_Boundaries_EW_BGC',
        promoteId: 'MSOA21CD',
        labelId: 'MSOA21NM',
        minZoom: 0,
        maxZoom: 10,
      },
      {
        analyticalAreaType: AnalyticalAreaType.Lsoa,
        name: 'Census LSOAs',
        singular: 'Census LSOA',
        mapboxSourceId: 'commonknowledge.7xigh3ye',
        sourceLayerId: 'Lower_layer_Super_Output_Area-4n9w4m',
        promoteId: 'LSOA21CD',
        labelId: 'LSOA21NM',
        minZoom: 10,
        maxZoom: 13,
        useBoundsInDataQuery: true,
      },
      {
        analyticalAreaType: AnalyticalAreaType.OutputArea,
        name: 'Census Output Areas',
        singular: 'Census Output Area',
        mapboxSourceId: 'commonknowledge.3pgj1hgo',
        sourceLayerId: 'output_areas_latlng-8qk00p',
        promoteId: 'OA21CD',
        labelId: 'OA21CD',
        minZoom: 13,
        maxZoom: MAX_VALID_ZOOM,
        useBoundsInDataQuery: true,
      },
    ],
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
