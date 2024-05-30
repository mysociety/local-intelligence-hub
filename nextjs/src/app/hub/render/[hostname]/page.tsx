import { gql } from "@apollo/client";
import { Render } from "@measured/puck/rsc";
import { getClient } from "@/services/apollo-client";
import { Metadata } from "next";
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