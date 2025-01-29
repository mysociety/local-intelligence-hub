import { ViewType } from '@/app/reports/[id]/reportContext'
import { LucideMapPin, Square, Table2 } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

export function ViewIcon({
  viewType,
  className,
}: {
  viewType?: ViewType
  className?: string
}) {
  const DefaultIcon = Square
  const Icon = viewType
    ? dataTypeDisplay[viewType]?.icon || DefaultIcon
    : DefaultIcon
  if (!Icon) return null
  return <Icon className={twMerge('w-4 h-4 text-meepGray-400', className)} />
}

export const dataTypeDisplay: Record<
  ViewType,
  {
    icon: any
    defaultName: string
    type: ViewType
    enabled: boolean
  }
> = {
  [ViewType.Map]: {
    icon: LucideMapPin,
    defaultName: 'Map',
    type: ViewType.Map,
    enabled: true,
  },
  [ViewType.Table]: {
    icon: Table2,
    defaultName: 'Table',
    type: ViewType.Table,
    enabled: true,
  },
}
