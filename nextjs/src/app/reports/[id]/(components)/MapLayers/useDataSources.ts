import { AnalyticalAreaType, MapReport } from '@/__generated__/graphql'
import { useQuery } from '@apollo/client'
import { useEffect, useState } from 'react'
import { MAP_REPORT_CONSTITUENCY_STATS } from '../../gql_queries'

const useDataSources = (report: MapReport) => {
  const [canQuery, setCanQuery] = useState(false)

  useEffect(() => {
    if (report) {
      setCanQuery(true)
    }
  }, [report])

  const constituencyAnalytics = useQuery(MAP_REPORT_CONSTITUENCY_STATS, {
    variables: {
      reportID: report?.id,
      analyticalAreaType: AnalyticalAreaType.ParliamentaryConstituency_2024,
    },
    skip: !canQuery,
  })

  const data =
    constituencyAnalytics.data?.mapReport.importedDataCountByConstituency

  return data
}

export default useDataSources
