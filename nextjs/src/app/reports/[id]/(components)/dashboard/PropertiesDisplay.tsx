import { useMemo } from 'react'

export function PropertiesDisplay({
  data,
  config,
}: {
  data: any
  config?: {
    columns?: string[]
  }
}) {
  const cols: string[] = useMemo(() => {
    if (config?.columns) {
      return config.columns
    } else if (data) {
      const keys = new Set<string>()
      for (const item of Array.isArray(data) ? data : [data]) {
        if (item) {
          for (const key of Object.keys(item)) {
            keys.add(String(key))
          }
        }
      }
      return Array.from(keys)
    } else {
      return []
    }
  }, [config, data])

  return (
    <div className="flex flex-col gap-2 my-2">
      {cols.map((column) => {
        const value = data[column]
        return (
          <div key={column} className="flex flex-col gap-0">
            <div className="text-meepGray-400 uppercase text-xs">{column}</div>
            <div className="text-white">
              {safeParseAsNumber(value) || value || 'N/A'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function safeParseAsNumber(value: any): number | null {
  try {
    if (typeof value === 'number') {
      return value
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      if (!isNaN(parsed)) {
        return parsed
      }
    }
    return null
  } catch (e) {
    return null
  }
}
