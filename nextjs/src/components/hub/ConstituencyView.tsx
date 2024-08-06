import {
  DataSourceType,
  GetLocalDataQuery,
} from "@/__generated__/graphql";
import { isAfter, isBefore } from "date-fns";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs-rounded";
import { useState } from "react";
import { HustingsCTA } from "@/app/hub/render/[hostname]/map/SearchPanel";
import Link from "next/link";
import IframeResizer from "iframe-resizer-react";
import queryString from "query-string";
import { useHubRenderContext } from "./HubRenderContext";
import { BACKEND_URL } from "@/env";
import { EventCard } from "./EventCard";

export function ConstituencyView({
  data,
  postcode
}: {
  data: GetLocalDataQuery["postcodeSearch"]["constituency"],
  postcode: string
}) {
  const [tab, setTab] = useState("candidates");
  const hubContext = useHubRenderContext();

  if (!data?.name) {
    return (
      <div className="p-6">
        <a
          href="#"
          className="block mb-2"
          onClick={(e) => {
            e.preventDefault();
            hubContext.reset();
          }}
        >
          &larr; Search another postcode
        </a>
        <div>This doesn{"'"}t look like a valid postcode.</div>
      </div>
    );
  }

  const events = data?.genericDataForHub
    ?.filter(
      (d) =>
        d.dataType.dataSet.externalDataSource.dataType ===
        DataSourceType.Event && !!d.startTime
    )
    .sort((a, b) =>
      // most recent first
      isAfter(new Date(a.startTime), new Date(b.startTime)) ? 1 : -1
    );

  const upcomingEvents = events?.filter((e) =>
    // future events
    isAfter(new Date(e.startTime), new Date())
  );

  const pastEvents = events?.filter((e) =>
    // future events
    isBefore(new Date(e.startTime), new Date())
  );

  return (
    <div className="flex flex-col overflow-y-hidden">
      <header className="mb-4 pt-6 px-6">
        <a
          href="#"
          className="block mb-4"
          onClick={(e) => {
            e.preventDefault();
            hubContext.reset();
          }}
        >
          &larr; Search another postcode
        </a>
        <h2 className="text-3xl text-hub-primary-950 font-bold">
          {data?.name}
        </h2>
      </header>
      <main>
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="flex flex-col max-h-full overflow-hidden items-stretch justify-start"
        >
          <TabsList className="px-6 py-4 mb-4 border-none w-full justify-start gap-2">
            {[
              {
                label:
                  hubContext.hostname === "peopleclimatenature.org"
                    ? "Message your MP 💬"
                    : "Candidates",
                key: "candidates",
              },
              {
                label: "Calendar",
                key: "events",
              },
            ].map((target) => (
              <TabsTrigger
                key={target.key}
                value={target.key}
                className="rounded text-hub-primary-600 bg-none hover:bg-hub-primary-50 data-[state=active]:bg-hub-primary-50 data-[state=active]:text-hub-primary-600 data-[state=active]:shadow-none"
              >
                {target.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="w-full border-b border-meepGray-200"></div>
          <TabsContent className="mt-0" value="candidates">
            <section className="space-y-4">
              {hubContext.hostname === "peopleclimatenature.org" ? (
                <IframeResizer
                  src={queryString.stringifyUrl({
                    url: "https://peopleclimatenature.onldspk.cc/2024-mps/frame/write",
                    query: {
                      body: "VqQTqd",
                      pc: postcode,
                    },
                  })}
                  width={"100%"}
                />
              ) : (
                <div className="space-y-3 my-4">
                  {data?.ppcs
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((person) => (
                      <article
                        key={person.id}
                        className="border-2 border-meepGray-200 rounded-md overflow-hidden p-4 flex flex-col gap-2 mx-4"
                      >
                        <header>
                          <div className="flex items-center">
                            {person.photo && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={new URL(
                                  person.photo.url,
                                  BACKEND_URL
                                ).toString()}
                                alt={person.name}
                                width={41}
                                height={41}
                                className="rounded-full mr-4"
                              />
                            )}
                            <h3 className="font-bold text-lg">{person.name}</h3>
                            {person.party && (
                              <span className="border-l border-x-meepGray-400 pl-2 ml-auto">
                                {person.party.name}
                              </span>
                            )}
                          </div>
                        </header>
                        {person.email ? (
                          <a
                            href={`mailto:${person.email.data?.replace(/["']/gim, "")}`}
                            target="_blank"
                            className="bg-hub-primary-200 text-hub-primary-900 px-3 py-2 text-center w-full block rounded-md"
                          >
                            Email Candidate
                          </a>
                        ) : (
                          <span className="bg-meepGray-200 text-hub-primary-900 px-3 py-2 text-center w-full block rounded-md">
                            No Email Address Yet
                          </span>
                        )}
                      </article>
                    ))}
                </div>
              )}
            </section>
          </TabsContent>
          <TabsContent className="mt-0 px-6 py-4" value="events">
            <h2 className="text-3xl text-hub-primary-950 font-bold mb-4"> Save the date! Prepare to meet your MP on Saturday 12 October.</h2>
            <p>Access free training and resources now to build your confidence, meet your MP, tell your story and get a commitment to action! </p>
            <a href="/resources">Resources | United for People, Climate & Nature (peopleclimatenature.org)</a>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}