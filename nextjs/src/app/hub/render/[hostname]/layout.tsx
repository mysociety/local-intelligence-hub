import { gql } from "@apollo/client";
import { getClient } from "@/services/apollo-client";
import { Metadata, ResolvingMetadata } from "next";
import { GetPageQuery, GetPageQueryVariables, HostAnalyticsQuery, HostAnalyticsQueryVariables } from "@/__generated__/graphql";
import { GET_PAGE } from "@/app/hub/render/[hostname]/query";
import { GoogleAnalytics } from "@next/third-parties/google";
import { CookieConsentComponent } from "@/components/hub/CookieConsent";
import ConsentRespectingGoogleAnalytics from "@/components/hub/ConsentRespectingGoogleAnalytics";
import { ConsentRespectingPosthogAnalytics } from "@/components/hub/ConsentRespectingPosthogAnalytics";

type Params = {
  hostname: string
  slug: string
}

export default async function Layout({ children, params: { hostname} }: { children: React.ReactNode, params: Params }) {
  const client = getClient();
  const page = await client.query<HostAnalyticsQuery, HostAnalyticsQueryVariables>({
    query: HOST_ANALYTICS,
    variables: { hostname }
  })
  return <>
    {children}
    <CookieConsentComponent />
    <ConsentRespectingPosthogAnalytics />
    {page.data?.hubByHostname?.googleAnalyticsTagId && (
      <ConsentRespectingGoogleAnalytics
        googleAnalyticsTagId={page.data?.hubByHostname.googleAnalyticsTagId}
      />
    )}
  </>
}

const HOST_ANALYTICS = gql`
  query HostAnalytics($hostname: String!) {
    hubByHostname(hostname: $hostname) {
      googleAnalyticsTagId
    }
  }
`

// nextjs metadata function — page title from GetPageQuery
export async function generateMetadata(
  { params }: {
    params: Params
  },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Fetch the page data
  const client = getClient();
  const page = await client.query<GetPageQuery, GetPageQueryVariables>({
    query: GET_PAGE,
    variables: {
      hostname: params.hostname
    }
  })
 
  return {
    title: {
      absolute: page.data.hubPageByPath?.seoTitle || "Mapped by Common Knowledge",
      template: `%s | ${page.data.hubPageByPath?.hub.seoTitle}`,
      default: page.data.hubPageByPath?.hub.seoTitle
    },
    description: page.data.hubPageByPath?.searchDescription || page.data.hubPageByPath?.hub.searchDescription,
    openGraph: page.data.hubPageByPath?.hub.seoImageUrl ? {
      images: page.data.hubPageByPath?.hub.seoImageUrl,
    } : undefined,
    icons: page.data.hubPageByPath?.hub?.faviconUrl ? {
      icon: [
        {
          url: page.data.hubPageByPath?.hub?.faviconUrl,
          href: page.data.hubPageByPath?.hub?.faviconUrl,
        }
      ],
    } : undefined,
    alternates: {
      // Ignore query params for filtering etc.
      canonical: "/"
    }
  }
}