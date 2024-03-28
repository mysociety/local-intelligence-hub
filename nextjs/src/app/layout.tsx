import "./globals.css";
import { ApolloWrapper } from "@/components/apollo-wrapper";
import { PHProvider } from './providers'
import dynamic from 'next/dynamic'
import { Metadata } from 'next'

const PostHogPageView = dynamic(() => import('./PostHogPageView'), {
  ssr: false,
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ApolloWrapper>
      <html lang="en">
        <PHProvider>
          <body>
            <PostHogPageView />
            {children}
          </body>
        </PHProvider>
      </html>
    </ApolloWrapper>
  );
}

export const metadata: Metadata = {
  title: {
    template: '%s | Mapped by CK',
    default: 'Mapped by Common Knowledge', // a default is required when creating a template
  },
}