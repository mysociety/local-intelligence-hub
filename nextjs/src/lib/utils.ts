import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatCrmNames(input: string): string {
  switch (input.toLowerCase()) {
    case 'actionnetwork':
      return 'Action Network'
    case 'editablegooglesheets':
      return 'Google Sheet'
    case 'tickettailor':
      return 'Ticket Tailor'
    case 'airtable':
      return 'Airtable'
    case 'mailchimp':
      return 'Mailchimp'
    default:
      return 'database'
  }
}

export function allKeysFromAllData(data: any): string[] {
  if (!data) return []
  const arr = Array.isArray(data) ? data : [data]
  if (arr.length === 0) return []
  const allKeys = new Set<string>()
  for (const item of data) {
    for (const key of Object.keys(item)) {
      allKeys.add(key)
    }
  }
  return Array.from(allKeys)
}
