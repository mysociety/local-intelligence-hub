function isValidDate(value: string): boolean {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) && // Matches YYYY-MM-DD format
    !isNaN(Date.parse(value))
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatKey(key: string): string {
  return capitalizeFirstLetter(key.replace(/_/g, ' '))
}

export function formatValue(value: any): string | JSX.Element {
  if (isValidDate(value)) {
    return formatDate(value)
  }
  // TODO
  // There may be cases where the value could be safely converted to a number but we still want it passed as a string? e.g. a phone number '01482 396368'
  if (safeParseAsNumber(value) !== null) return String(safeParseAsNumber(value))

  if (Array.isArray(value)) {
    return formatArray(value)
  }

  if (typeof value === 'object' && value !== null) {
    return formatObject(value)
  }

  return capitalizeFirstLetter(String(value || 'N/A').replace(/_/g, ' '))
}

export function formatObject(obj: Record<string, any>): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      {Object.entries(obj).map(([key, val]) => (
        <div key={key}>
          <span>{formatKey(key)}:</span> {formatValue(val)}
        </div>
      ))}
    </div>
  )
}

export function formatArray(arr: any[]): JSX.Element {
  // If the array consists of a single string (like an address), display it as text
  if (arr.length === 1 && typeof arr[0] === 'string') {
    return <span className="whitespace-pre-line">{arr[0]}</span>
  }

  // Otherwise, format as a list
  return (
    <ul>
      {arr.map((item, index) => (
        <li key={index}>
          {typeof item === 'object' && item !== null
            ? formatObject(item)
            : formatValue(item)}
        </li>
      ))}
    </ul>
  )
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function safeParseAsNumber(value: any): number | null {
  try {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      return isNaN(parsed) ? null : parsed
    }
    return null
  } catch {
    return null
  }
}

export function isEmptyValue(value: any): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  )
}
