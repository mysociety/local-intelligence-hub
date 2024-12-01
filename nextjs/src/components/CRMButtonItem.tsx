import { DataSourceType } from '@/__generated__/graphql'
import { SourceOption } from '@/lib/data'
import { format } from 'd3-format'
import pluralize from 'pluralize'
import { DataSourceIcon } from './DataSourceIcon'

function dataTypeRecordLabel(dataType: DataSourceType) {
  switch (dataType) {
    case DataSourceType.Member:
      return 'member'
    case DataSourceType.Location:
      return 'location'
    case DataSourceType.Story:
      return 'story'
    case DataSourceType.Event:
      return 'event'
    default:
      return 'record'
  }
}

export function CRMSelection({
  source,
  isShared,
  displayCount = true,
}: {
  isShared?: boolean
  source: SourceOption
  displayCount?: boolean
}) {
  return (
    <div className="flex flex-row items-center gap-2 text-left">
      <DataSourceIcon crmType={source.crmType} className="w-5" />
      <div>
        <div>{source.name}</div>
        {!!source?.importedDataCount && displayCount && (
          <div className="text-meepGray-400 group-hover:text-meepGray-800 text-xs">
            {format(',')(source?.importedDataCount)}{' '}
            {pluralize(
              dataTypeRecordLabel(source.dataType),
              source?.importedDataCount
            )}
          </div>
        )}
        {isShared &&
          source.__typename === 'SharedDataSource' &&
          source.organisation?.name && (
            <div className="text-pink-400 group-hover:text-meepGray-800 text-xs">
              Shared by {source?.organisation?.name}
            </div>
          )}
      </div>
    </div>
  )
}
