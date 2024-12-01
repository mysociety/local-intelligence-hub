import { requireAuth } from '@/lib/server-auth'

import { Metadata } from 'next'
import NewExternalDataSourceWrapper from './NewExternalDataSourceWrapper'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return <NewExternalDataSourceWrapper>{children}</NewExternalDataSourceWrapper>
}

export const metadata: Metadata = {
  title: 'Connect New Data Source',
}
