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

  return capitalizeFirstLetter(String(value || 'N/A').replace(/_/g, ' '))
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
