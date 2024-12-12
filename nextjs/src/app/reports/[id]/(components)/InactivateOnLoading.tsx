import { LoadingIcon } from '@/components/ui/loadingIcon'
import { useDebounce } from '@uidotdev/usehooks'
import clsx from 'clsx'
import React from 'react'
import { useReport } from './ReportProvider'

export default function InactivateOnLoading({
  children,
}: {
  children: React.ReactNode
}) {
  const { dataLoading: undebouncedDataLoading } = useReport()
  const dataLoading = useDebounce(undebouncedDataLoading, 300)

  return (
    <div>
      <div
        className={clsx(
          'flex flex-col transition',
          dataLoading ? 'blur-md grayscale pointer-events-none' : ''
        )}
      >
        {children}
      </div>
      <div
        className={clsx(
          'absolute top-0 w-full h-[300px] flex flex-col justify-center items-center',
          dataLoading ? 'flex' : 'hidden'
        )}
      >
        <p className="text-white">Loading data...</p>
        <LoadingIcon className="w-20 h-20 mt-4" />
      </div>
    </div>
  )
}
