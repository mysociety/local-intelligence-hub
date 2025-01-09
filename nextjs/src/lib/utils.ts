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

export function allKeysFromAllData(data: any[]): string[] {
  if (!data || !Array.isArray(data)) return []
  const allKeys: Record<string, boolean> = {}
  for (const item of data) {
    for (const key of Object.keys(item)) {
      allKeys[key] = true
    }
  }
  return Object.keys(allKeys)
}
