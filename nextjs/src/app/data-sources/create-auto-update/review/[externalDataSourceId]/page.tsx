"use client";

import { Button } from "@/components/ui/button";
import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateAutoUpdateFormContext } from "../../NewExternalDataSourceWrapper";
import { gql, useQuery } from "@apollo/client";
import {
  AutoUpdateCreationReviewQuery,
  AutoUpdateCreationReviewQueryVariables,
} from "@/__generated__/graphql";
import { AutoUpdateCard } from "@/components/AutoUpdateCard";
import { LoadingIcon } from "@/components/ui/loadingIcon";

const GET_UPDATE_CONFIG = gql`
  query AutoUpdateCreationReview($ID: ID!) {
    externalDataSource(pk: $ID) {
      id
      name
      connectionDetails {
        crmType: __typename
      }
      autoUpdateEnabled
      autoUpdateMapping {
        source
        sourcePath
        destinationColumn
      }
      jobs {
        lastEventAt
        status
      }
    }
  }
`;

export default function Page({
  params: { externalDataSourceId },
}: {
  params: { externalDataSourceId: string };
}) {
  const router = useRouter();
  const context = useContext(CreateAutoUpdateFormContext);

  useEffect(() => {
    context.setStep(4)
  }, [context])

  const pageQuery = useQuery<
    AutoUpdateCreationReviewQuery,
    AutoUpdateCreationReviewQueryVariables
  >(GET_UPDATE_CONFIG, {
    variables: {
      ID: externalDataSourceId,
    },
  });

  if (pageQuery.error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{pageQuery.error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-hLg">Activate data sync</h1>
        <p className="mt-6 text-meepGray-400 max-w-sm">
          Your almost there! Active the data sync to start syncing data. Note,
          this may take a while if you are using a large amount of data layers.
        </p>
      </header>
      {pageQuery.loading || !pageQuery.data ? (
        <LoadingIcon />
      ) : (
        <AutoUpdateCard
          externalDataSource={pageQuery.data.externalDataSource}
        />
      )}
      <Button
        variant={"reverse"}
        onClick={() => {
          router.push(`/data-sources`);
        }}
      >
        Back to data syncs
      </Button>
    </div>
  );
}
