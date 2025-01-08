import {
  AnalyticalAreaType,
  MapReportCountByAreaQuery,
  MapReportCountByAreaQueryVariables,
  MapReportStatsByAreaQuery,
  MapReportStatsByAreaQueryVariables,
} from '@/__generated__/graphql'
import { useQuery } from '@apollo/client'
import { useEffect, useMemo } from 'react'
import { useReport } from './(components)/ReportProvider'
import {
  MAP_REPORT_COUNT_BY_AREA,
  MAP_REPORT_STATS_BY_AREA,
} from './gql_queries'
import { AggregationOperation, MapReportExtended } from './reportContext'
import { ENABLED_ANALYTICAL_AREA_TYPES } from './types'

export type DataByBoundary =
  MapReportCountByAreaQuery['mapReport']['importedDataCountByArea']
export type ExternalDataByBoundary =
  MapReportStatsByAreaQuery['mapReport']['importedDataByArea']

const useDataByBoundary = ({
  report,
  boundaryType,
}: {
  report?: MapReportExtended | undefined
  boundaryType?: AnalyticalAreaType
  // Source fields are the numeric data columns from the external data source
  getSourceFieldNames?: boolean
}): { data: DataByBoundary; fieldNames?: string[]; loading?: boolean } => {
  if (boundaryType && !ENABLED_ANALYTICAL_AREA_TYPES.includes(boundaryType)) {
    throw new Error('Invalid boundary type')
  }
  const { setDataLoading } = useReport()

  const selectedDataSource = report?.layers?.find(
    (layer) =>
      layer.id === report?.displayOptions?.dataVisualisation?.dataSource
  )

  const queryForAreaStats = selectedDataSource?.source.dataType === 'AREA_STATS'

  const queryForCounts = !queryForAreaStats

  const { data: externalStatsByBoundary, loading: loadingStats } = useQuery<
    MapReportStatsByAreaQuery,
    MapReportStatsByAreaQueryVariables
  >(MAP_REPORT_STATS_BY_AREA, {
    variables: {
      reportID: report?.id,
      analyticalAreaType: boundaryType!,
      layerIds: selectedDataSource?.id ? [selectedDataSource.id] : [],
    },
    skip: !boundaryType || !report || !queryForAreaStats,
  })

  const { data: countsByBoundary, loading: loadingCounts } = useQuery<
    MapReportCountByAreaQuery,
    MapReportCountByAreaQueryVariables
  >(MAP_REPORT_COUNT_BY_AREA, {
    variables: {
      reportID: report?.id,
      analyticalAreaType: boundaryType!,
      layerIds: selectedDataSource?.id ? [selectedDataSource.id] : [],
    },
    skip: !boundaryType || !report || !queryForCounts,
  })

  const loading = loadingStats || loadingCounts
  useEffect(() => {
    if (loading) {
      setDataLoading(true)
    } else {
      setDataLoading(false)
    }
  }, [loading])

  let fieldNames: string[] | undefined

  return useMemo(() => {
    if (queryForCounts) {
      return {
        data: countsByBoundary?.mapReport.importedDataCountByArea || [],
        loading,
      }
    } else if (queryForAreaStats) {
      const rawData = externalStatsByBoundary?.mapReport.importedDataByArea
      const data = rawData && processNumericFieldsInDataSource(rawData)
      fieldNames = data && getNumericFieldsFromDataSource(data)

      // Data source logic
      // TODO: later here is where we do arithmetic operations with data from multiple sources
      const dataSourceField =
        report?.displayOptions?.dataVisualisation?.dataSourceField

      // The added count field is the value of the dataSourceField
      // The mapbox layer code expects a field called "count" to visualise numeric data
      if (data && dataSourceField) {
        const dataWithCounts = data.map((row) => {
          const value = row.importedData[dataSourceField]
          return {
            ...row,
            count: value,
          }
        }) as DataByBoundary

        // Delete rows where the import geocoding has failed (no GSS code)
        const filteredDataWithCounts = dataWithCounts.filter(
          (row) => row.gss !== null && row.count > 0
        )

        // Sum the counts for each GSS code. This allows us traverse boundary types using the
        // same data source and have the counts summed up for the GSS codes
        const operation =
          report?.displayOptions?.dataVisualisation?.aggregationOperation ||
          AggregationOperation.Sum
        const summedByGss = filteredDataWithCounts.reduce((acc, row) => {
          const existing = acc.find((item) => item.gss === row.gss)
          const allItems = filteredDataWithCounts.filter(
            (item) => item.gss === row.gss
          )
          if (existing) {
            switch (operation) {
              case AggregationOperation.Mean:
                existing.count = (existing.count + row.count) / allItems.length
                break
              case AggregationOperation.Sum:
              default:
                existing.count += row.count
                break
            }
          } else {
            acc.push({ ...row })
          }
          return acc
        }, [] as DataByBoundary)

        return {
          data: summedByGss,
          fieldNames,
          loading,
        }
      } else {
        return { fieldNames, data: [], loading }
      }
    }

    return { data: [], loading }
  }, [
    queryForCounts,
    countsByBoundary,
    queryForAreaStats,
    externalStatsByBoundary,
    loading,
    report,
  ])
}

export default useDataByBoundary

export function getNumericFieldsFromDataSource(data: ExternalDataByBoundary) {
  if (!data || data.length === 0) return []
  const firstRow = data[0].importedData

  return Object.keys(firstRow).filter((key) => {
    const value = firstRow[key]
    return typeof value === 'number'
  })
}

/* Make sure that valid number strings are converted to numbers */
function processNumericFieldsInDataSource(data: ExternalDataByBoundary) {
  return data.map((row) => {
    const processedData = { ...row.importedData }
    Object.keys(processedData).forEach((key) => {
      const value = processedData[key]
      if (typeof value === 'string' && !isNaN(Number(value))) {
        processedData[key] = Number(value)
      }
    })
    return {
      ...row,
      importedData: processedData,
    }
  })
}
