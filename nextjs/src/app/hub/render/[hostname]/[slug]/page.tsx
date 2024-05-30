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

export default async function Page({ params: { hostname, slug } }: { params: Params }) {
  const client = getClient();
  const page = await client.query<GetPageQuery, GetPageQueryVariables>({
    query: GET_PAGE,
    variables: {
      hostname,
      path: slug
    }
  })

  return (
    <Render config={conf} data={page.data?.hubPageByPath?.puckJsonContent} />
  )
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
      hostname: params.hostname,
      path: params.slug
    }
  })
 
  return {
    title: page.data.hubPageByPath?.title,
    // TODO: some hardcoded image
    // openGraph: {
    //   images: ['/some-specific-page-image.jpg', ...previousImages],
    // },
  }
}