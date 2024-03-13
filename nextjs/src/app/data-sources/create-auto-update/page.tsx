"use client";

import { Button } from "@/components/ui/button";
import { twMerge } from "tailwind-merge";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateAutoUpdateFormContext } from "./NewExternalDataSourceWrapper";
import {
  externalDataSourceOptions,
  getSourceOptionForTypename,
} from "@/lib/data";
import { gql, useQuery } from "@apollo/client";
import { AllExternalDataSourcesQuery, DataSourceType } from "@/__generated__/graphql";
import { formatRelative } from "date-fns";

const ALL_EXTERNAL_DATA_SOURCES = gql`
  query AllExternalDataSources {
    externalDataSources {
      id
      name
      createdAt
      dataType
      connectionDetails {
        crmType: __typename
        ... on AirtableSource {
          baseId
          tableId
        }
      }
      autoUpdateEnabled
    }
  }
`;

export default function Page() {
  const router = useRouter();
  const context = useContext(CreateAutoUpdateFormContext);
  const crms = useQuery<AllExternalDataSourcesQuery>(ALL_EXTERNAL_DATA_SOURCES);
  const unusedCRMs = crms.data?.externalDataSources.filter((d) => !d.autoUpdateEnabled && d.dataType === DataSourceType.Member);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    context.setStep(1)
  }, [context])

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-hLg">Select platform to sync data to</h1>
        <p className="mt-6 text-meepGray-400 max-w-sm">
          We currently support the following platforms. If your platform isn’t
          on this list,{" "}
          <a href="mailto:hello@commonknowledge.coop">
            get in touch to see how we can help.
          </a>
        </p>
      </header>
      <h2 className="text-hSm">Connect a new data source</h2>
      {Object.values(externalDataSourceOptions).map((externalDataSource) => (
        <div
          key={externalDataSource.key}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-7"
        >
          <div
            onClick={() => {
              setSource(externalDataSource.key);
            }}
            className={twMerge(
              "cursor-pointer rounded-3xl bg-meepGray-700 px-10 py-6 overflow-hidden flex flex-row items-center justify-center transition-all hover:border-brandBlue border-2 box-border",
              source === externalDataSource.key && "border-brandBlue border-2",
            )}
          >
            <externalDataSource.logo className="w-full" />
          </div>
        </div>
      ))}
      <Button
        disabled={!source}
        variant={"reverse"}
        onClick={() => {
          router.push(`/data-sources/create-auto-update/connect/${source}`);
        }}
      >
        Continue
      </Button>
      {!!unusedCRMs?.length && (
        <section className="space-y-7 pt-7">
          <h2 className="text-hSm">Or configure updates for an existing data source</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-7">
            {unusedCRMs.map((externalDataSource) => {
                const Logo = getSourceOptionForTypename(
                  externalDataSource.connectionDetails.crmType,
                )!.logo;
                return (
                  <article
                    key={externalDataSource.id}
                    className="cursor-pointer rounded-3xl border-meepGray-600 px-6 py-5 space-y-3 transition-all hover:border-brandBlue border-2 box-border"
                    onClick={() => {
                      router.push(
                        `/data-sources/create-auto-update/configure/${externalDataSource.id}`,
                      );
                    }}
                  >
                    <Logo className='w-20'/>
                    <div className="text-hSm font-bold">{externalDataSource.name}</div>
                    <div className="text-sm text-meepGray-400">
                      <p>
                        Created{" "}
                        {formatRelative(
                          externalDataSource.createdAt,
                          new Date(),
                        )}
                      </p>
                      {!!externalDataSource.connectionDetails.baseId && (
                        <div className='mt-2'>
                          <code>
                            {externalDataSource.connectionDetails.baseId}
                          </code>
                          <br />
                          <code>
                            {externalDataSource.connectionDetails.tableId}
                          </code>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
}
