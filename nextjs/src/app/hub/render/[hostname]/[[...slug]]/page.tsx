"use server"

import { gql } from "@apollo/client";
import { Render } from "@measured/puck";
import { getClient } from "@/services/apollo-client";
import { Metadata } from "next";
import { GetPageQuery, GetPageQueryVariables } from "@/__generated__/graphql";
import { conf } from "@/data/puck/config";
import RenderPuck from "../RenderPuck";

type Params = {
  hostname: string
  slug: string[]
}

export default async function Page({ params: { hostname, slug } }: { params: Params }) {
  const client = getClient();
  const page = await client.query<GetPageQuery, GetPageQueryVariables>({
    query: GET_PAGE,
    variables: {
      hostname,
      path: slug?.join("/")
    }
  })

  return (
    <RenderPuck page={page.data.hubPageByPath?.puckJsonContent} />
  )
}

const GET_PAGE = gql`
  query GetPage($hostname: String!, $path: String) {
    hubPageByPath(hostname: $hostname, path: $path) {
      id
      title
      path
      puckJsonContent
    }
  }
`

// const metadata: Metadata = {
//   title: "Hub page preview",
// };