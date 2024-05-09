// page.js
"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { gql, useApolloClient, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { Provider as JotaiProvider } from "jotai";
import { MapProvider } from "react-map-gl";
import { PublicMap } from "@/components/report/PublicMap";
import { GetPublicMapReportQuery, GetPublicMapReportQueryVariables } from "@/__generated__/graphql";

type Params = {
  orgSlug: string
  reportSlug: string
}

export default function Page({ params: { orgSlug, reportSlug } }: { params: Params }) {
  const client = useApolloClient();
  const router = useRouter();
  
  const report = useQuery<GetPublicMapReportQuery, GetPublicMapReportQueryVariables>(GET_PUBLIC_MAP_REPORT, {
    variables: { orgSlug, reportSlug },
  });

  return (
    <MapProvider>
      <JotaiProvider>
        <PublicMap />
        <div>
          <h1>{report.data?.publicMapReport.name}</h1>
          <p>{report.data?.publicMapReport.organisation.name}</p>
          <p>{report.data?.publicMapReport.layers.map((layer) => layer.name).join(", ")}</p>
        </div>
      </JotaiProvider>
    </MapProvider>
  )
}

const GET_PUBLIC_MAP_REPORT = gql`
  query GetPublicMapReport($orgSlug: String!, $reportSlug: String!) {
    publicMapReport(orgSlug: $orgSlug, reportSlug: $reportSlug) {
      id
      name
      displayOptions
      organisation {
        id
        slug
        name
      }
      layers {
        id
        name
      }
    }
  }
`