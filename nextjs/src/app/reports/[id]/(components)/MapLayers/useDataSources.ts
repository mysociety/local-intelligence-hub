import { AnalyticalAreaType, MapReport } from '@/__generated__/graphql'
import { useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import {
  MAP_REPORT_CONSTITUENCY_STATS,
  MAP_REPORT_WARD_STATS,
} from '../../gql_queries'
import { PoliticalBoundaries } from '../../reportContext'

const useDataSources = (
  report: MapReport,
  boundaryType: PoliticalBoundaries
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
  let dataOutputKey

  if (boundaryType === 'uk_westminster_constituencies') {
    query = MAP_REPORT_CONSTITUENCY_STATS
    variables.analyticalAreaType =
      AnalyticalAreaType.ParliamentaryConstituency_2024
    dataOutputKey = 'importedDataCountByConstituency'
  } else if (boundaryType === 'uk_westminster_wards') {
    query = MAP_REPORT_WARD_STATS
    dataOutputKey = 'importedDataCountByWard'
  }
  if (!query || !dataOutputKey) throw new Error('Invalid boundary type')

  const constituencyAnalytics = useQuery(query, { variables, skip: !canQuery })

  return constituencyAnalytics.data?.mapReport[dataOutputKey]
}

export default useDataSources
