"use server"

import { getClient } from "@/services/apollo-client";
import { Metadata } from "next";
import { GetPageQuery, GetPageQueryVariables } from "@/__generated__/graphql";
import { GET_PAGE } from "./gql";
import { redirect } from "next/navigation";
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

  const puckJsonContent = page.data?.hubPageByPath?.puckJsonContent

  // TODO: display 404 in this case
  if (!puckJsonContent) {
    return redirect('/')
  }

  return (
    <RenderPuck page={puckJsonContent} />
  )
}

// const metadata: Metadata = {
//   title: "Hub page preview",
// };
