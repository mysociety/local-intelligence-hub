import {
  DataSourceType,
  GetLocalDataQuery,
  Person,
} from "@/__generated__/graphql";
import { formatDate, formatRelative, isAfter } from "date-fns";
import { Ticket } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs-rounded";
import { useState } from "react";

export function ConstituencyView({ data }: { data: GetLocalDataQuery }) {
  const [tab, setTab] = useState("events");

  if (!data?.postcodeSearch?.constituency?.name) {
    return (
      <div>
        <a
          href="#"
          className="block mb-2"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState(null, "", "/map");
          }}
        >
          &larr; Search another postcode
        </a>
        <div>Nothing found.</div>
        {/* TODO: something more useful, like other constituencies that *do* have events? */}
      </div>
    );
  }

  const events = data?.postcodeSearch?.constituency?.genericDataForHub?.filter(
    (d) =>
      // event type
      d.dataType.dataSet.externalDataSource.dataType === DataSourceType.Event &&
      // future events
      isAfter(new Date(d.startTime), new Date())
  );

  return (
    <>
      <a
        href="#"
        className="block mb-4"
        onClick={(e) => {
          e.preventDefault();
          window.history.pushState(null, "", "/map");
        }}
      >
        &larr; Search another postcode
      </a>
      <header className="mb-4">
        <h2 className="text-3xl text-green-950 font-bold">
          {data?.postcodeSearch?.constituency?.name}
        </h2>
      </header>
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex flex-col max-h-full overflow-hidden items-start justify-start"
      >
        <TabsList className="p-0 py-4 mb-4 border-none w-full justify-start gap-2">
          {["Events", "Candidates"].map((target) => (
            <TabsTrigger
              key={target}
              value={target.toLowerCase()}
              className="rounded text-jungle-green-600 bg-none hover:bg-jungle-green-50 data-[state=active]:bg-jungle-green-50 data-[state=active]:text-jungle-green-600 data-[state=active]:shadow-none"
            >
              {target}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="w-full border-b border-meepGray-200 mb-6"></div>
        <TabsContent className="mt-0" value="events">
          {events && events.length ? (
            <>
              <div className="mb-4">
                Help the campaign in {data?.postcodeSearch?.constituency?.name}{" "}
                by coming along to one of these upcoming events:
              </div>
              <section className="space-y-4">
                {events
                  .sort((a, b) =>
                    // most recent first
                    isAfter(new Date(a.startTime), new Date(b.startTime))
                      ? 1
                      : -1
                  )
                  .map((i: any) => (
                    <article
                      key={i.id}
                      className="border-2 border-meepGray-200 rounded-md overflow-hidden p-4"
                    >
                      <header>
                        <div className="text-meepGray-500">
                          {formatRelative(new Date(i.startTime), new Date())}
                        </div>
                        <h3 className="font-bold text-lg">{i.title}</h3>
                      </header>
                      <div className="grid grid-cols-2">
                        <div>
                          <div className="text-meepGray-500">Date/Time</div>
                          <div>{formatDate(i.startTime, "EE do MMM")}</div>
                        </div>
                        <div>
                          <div className="text-meepGray-500">Address</div>
                          <div>
                            {i.address} {i.postcode}
                          </div>
                        </div>
                      </div>
                      <p>
                        <b className="text-meepGray-500 font-bold">
                          What{"'"}s this about?
                        </b>
                        &nbsp;
                        {i.description}
                      </p>
                      {i.publicUrl && (
                        <a
                          href={i.publicUrl}
                          target="_blank"
                          className="bg-green-200 text-green-900 px-3 py-2 text-center w-full block rounded-md"
                        >
                          <Ticket /> More info &amp; register
                        </a>
                      )}
                    </article>
                  ))}
              </section>
            </>
          ) : (
            <p>
              No upcoming events in {data?.postcodeSearch?.constituency?.name}.
            </p>
          )}
        </TabsContent>
        <TabsContent className="mt-0" value="candidates">
          <section className="space-y-4">
            {data?.postcodeSearch?.constituency?.ppcs
              //.sort((a, b) => a.name < b.name ? -1 : 1)
              .map((person) => (
                <article
                  key={person.id}
                  className="border-2 border-meepGray-200 rounded-md overflow-hidden p-4 flex flex-col gap-2"
                >
                  <header>
                    <div className="flex items-center">
                      {person.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={new URL(
                            person.photo.url,
                            process.env.NEXT_PUBLIC_BACKEND_BASE_URL
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
                      href={`mailto:${person.email.data}`}
                      target="_blank"
                      className="bg-green-200 text-green-900 px-3 py-2 text-center w-full block rounded-md"
                    >
                      Email Candidate
                    </a>
                  ) : (
                    <span className="bg-meepGray-200 text-green-900 px-3 py-2 text-center w-full block rounded-md">
                      No Email Address Yet
                    </span>
                  )}
                </article>
              ))}
          </section>
        </TabsContent>
      </Tabs>
    </>
  );
}
