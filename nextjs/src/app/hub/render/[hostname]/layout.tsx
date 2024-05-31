import { gql } from "@apollo/client";
import { Render } from "@measured/puck/rsc";
import { getClient } from "@/services/apollo-client";
import { Metadata, ResolvingMetadata } from "next";
import { GetPageQuery, GetPageQueryVariables } from "@/__generated__/graphql";
import { conf } from "@/data/puck/config";
import { GET_PAGE } from "@/app/hub/render/[hostname]/query";

type Params = {
  hostname: string
  slug: string
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

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
  }
}