import { useMemo } from 'react'
import { formatKey, formatValue, isEmptyValue } from './utils'

export function PropertiesDisplay({
  data,
}: {
  data: any
  config?: {
    columns?: string[]
  }
}) {
  // Don't display column names with no values
  const columns = useMemo(() => {
    return Object.keys(data || {}).filter((key) => !isEmptyValue(data[key]))
  }, [data])

  return (
    <div className="flex flex-col gap-2 my-2">
      {columns.map((column) => (
        <div key={column} className="flex flex-col gap-0">
          <div className="text-meepGray-400 uppercase text-xs">
            {formatKey(column)}
          </div>
          <div className="text-white">{formatValue(data[column])}</div>
        </div>
      ))}
    </div>
  )
}
