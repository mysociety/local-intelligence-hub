import { Metadata } from 'next'

import { requireAuth } from '@/lib/server-auth'

import ReportList from './ReportList'

export default async function Page() {
  await requireAuth()

  return (
    <div className="max-w-7xl space-y-7 w-full">
      <PageHeader />
      <ReportList />
    </div>
  )
}

function PageHeader() {
  return (
    <header>
      <div>
        <h1 className="text-hLg">Your maps</h1>
      </div>
    </header>
  )
}

export const metadata: Metadata = {
  title: 'Your maps',
}
