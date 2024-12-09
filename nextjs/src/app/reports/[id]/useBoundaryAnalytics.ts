import {
  AnalyticalAreaType,
  GroupedDataCount,
  MapReportConstituencyStatsQuery,
} from '@/__generated__/graphql'
import { useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import {
  MAP_REPORT_CONSTITUENCY_STATS,
  MAP_REPORT_WARD_STATS,
} from './gql_queries'
import { MapReportExtended } from './reportContext'

const useBoundaryAnalytics = (
  report: MapReportExtended | undefined,
  boundaryType: AnalyticalAreaType
) => {
  const [canQuery, setCanQuery] = useState(false)

  useEffect(() => {
    if (report) {
      setCanQuery(true)
    }
  }, [report])

  let query
  let variables: any = {
    reportID: report?.id,
  }
  let dataOutputKey: keyof MapReportConstituencyStatsQuery['mapReport']

  // TODO: This is where we can implement arithmetic operations on data from multiple
  // sources, such as the sum of member count per political boundary from two different
  // organisation's membership lists

  // All the queries below do is return membership counts by boundary type
  if (boundaryType === 'parliamentary_constituency_2024') {
    query = MAP_REPORT_CONSTITUENCY_STATS
    variables.analyticalAreaType =
      AnalyticalAreaType.ParliamentaryConstituency_2024
    dataOutputKey = 'importedDataCountByConstituency'
  } else if (boundaryType === 'admin_ward') {
    query = MAP_REPORT_WARD_STATS
    // @ts-ignore — asserting here that importedDataCountByWard will also return GroupedDataCount[]
    dataOutputKey = 'importedDataCountByWard'
  } else throw new Error('Invalid boundary type')

  const boundaryAnalytics = useQuery<MapReportConstituencyStatsQuery>(query, {
    variables,
    skip: !canQuery,
  })

  return boundaryAnalytics.data?.mapReport[dataOutputKey] as GroupedDataCount[]
}

export default useBoundaryAnalytics
