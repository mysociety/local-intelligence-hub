import { requireAuth } from "@/lib/server-auth";
import { Metadata } from "next";
import { getClient } from "@/services/apollo-client";
import { gql } from "@apollo/client";
import { redirect } from "next/navigation";
import HubPageEditor from "@/components/hub/HubPageEditor";
import { GetEditableHubsQuery, GetEditableHubsQueryVariables, VerifyPageQuery, VerifyPageQueryVariables } from "@/__generated__/graphql";

export default async function Page({ params: { pageId } }: { params: { pageId?: string[] } }) {
  await requireAuth();
  const client = getClient();
  const pId = pageId && pageId.length > 0 ? pageId[pageId.length - 1] : null
  const hubLandingPage = await client.query<GetEditableHubsQuery, GetEditableHubsQueryVariables>({
    query: gql`
      query GetEditableHubs {
        hubHomepages {
          id
        }
      }
    `
  })
  if (!hubLandingPage.data?.hubHomepages?.length) {
    console.error("No hub homepages found")
    return redirect("/");
  }
  const hub = hubLandingPage.data.hubHomepages?.[0]
  if (!pId) {
    return redirect(`/hub/editor/${hub.id}`);
  } else {
    // Check it exists
    try {
      const pageHub = await client.query<VerifyPageQuery, VerifyPageQueryVariables>({
        query: gql`
          query VerifyPage($pageId: ID!) {
            hubHomepages {
              id
            }
            hubPage(pk: $pageId) {
              id
              hub {
                id
              }
            }
          }
        `,
        variables: {
          pageId: pId
        }
      })

      return (
        <HubPageEditor hubId={pageHub.data.hubPage.hub.id} pageId={pId} />
      )
    } catch (e) {
      return redirect(`/hub/editor/${hub.id}`);
    }
  }
}

export const metadata: Metadata = {
  title: "Hub manager",
};