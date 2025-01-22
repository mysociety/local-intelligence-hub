import { DataSourceType } from '@/__generated__/graphql'
import { dataTypeIcons } from '@/lib/data'
import { twMerge } from 'tailwind-merge'

export function DataSourceTypeIcon({
  dataType,
  className,
  defaultIcon: DefaultIcon,
}: {
  dataType?: DataSourceType
  defaultIcon?: any
  className?: string
}) {
  const Icon = dataType
    ? dataTypeIcons[dataType]?.icon || DefaultIcon
    : DefaultIcon
  if (!Icon) return null
  return (
    <Icon
      className={twMerge(
        'w-4 h-4 text-meepGray-400 fill-meepGray-400',
        className
      )}
    />
  )
}
