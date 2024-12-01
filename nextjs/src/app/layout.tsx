import { ApolloWrapper } from '@/components/ApolloWrapper'
import { FRONTEND_URL } from '@/env'
import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import NextTopLoader from 'nextjs-toploader'
import { Suspense } from 'react'
import { openGraphImage } from '../lib/shared-metadata'
import './globals.css'
import { PHProvider } from './providers'

const PostHogPageView = dynamic(() => import('../components/PostHogPageView'), {
  ssr: false,
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ApolloWrapper>
      <html lang="en">
        <PHProvider>
          <body>
            <Suspense>
              <PostHogPageView />
            </Suspense>
            <NextTopLoader />
            {children}
          </body>
        </PHProvider>
      </html>
    </ApolloWrapper>
  )
}

export const metadata: Metadata = {
  openGraph: {
    ...openGraphImage,
  },
  title: {
    template: '%s | Mapped by Common Knowledge',
    default: 'Mapped by Common Knowledge', // a default is required when creating a template
  },
  metadataBase: new URL(FRONTEND_URL),
}
