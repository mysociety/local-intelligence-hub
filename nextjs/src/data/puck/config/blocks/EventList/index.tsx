/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ComponentConfig, Field, Fields } from "@measured/puck";
import CirclePattern from "../../../../../../public/hub/circle-pattern.svg";
import Image from "next/image";
import ArrowTopRight from "../../../../../../public/hub/arrow-top-right.svg";
import Link from "next/link";
import { PuckText } from "../../components/PuckText"
import { gql, useQuery } from "@apollo/client";
import { LoadingIcon } from "@/components/ui/loadingIcon";
import { makeFrontEndClient } from "@/components/apollo-wrapper";
import { compareAsc, formatDate, isAfter } from "date-fns";

export type EventListProps = {
  displayEventTitles: boolean
  displayEventDescriptions: boolean
  eventDataSource: any
  noUpcomingEventsMessage: string
};

const TypeBadge = ({ type }: { type: string }) => {
  return (
    <div>
      <div className=" uppercase inline-block text-jungle-green-700 bg-jungle-green-100 font-normal rounded-full py-1 px-3">{type}</div>
    </div>
  );
}

export const EventList: ComponentConfig<EventListProps> = {
  fields: {
    displayEventTitles: {
      type: "radio",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    displayEventDescriptions: {
      type: "radio",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    eventDataSource: {
      type: "external",
      fetchList: async () => {
        // Get external data sources for user's org of type EVENT
        const client = makeFrontEndClient()
        const { data } = await client.query({
          query: gql`
            query GetEventSources {
              externalDataSources(filters:  {
                 dataType: EVENT
              }) {
                name
                id
                eventCount: importedDataCount
              }
            }
          `
        })
        return data.externalDataSources.map((source: any) => ({
          name: source.name,
          count: source.eventCount,
          id: source.id,
        }))
      },
    },
    noUpcomingEventsMessage: {
      type: "text",
    },
  },
  defaultProps: {
    displayEventTitles: false,
    displayEventDescriptions: false,
    eventDataSource: null,
    noUpcomingEventsMessage: "There aren't any upcoming events",
  },
  render: (props) => {
    return (
      <RenderEventList {...props} />
    )
  }
};

type EventData = {
    id: string,
    title: string,
    description: string,
    startTime: string,
    endTime?: string,
    publicUrl: string
}

function RenderEventList ({ eventDataSource, displayEventTitles, displayEventDescriptions, noUpcomingEventsMessage }: EventListProps) {
  const eventData = useQuery<{ genericDataByExternalDataSource: EventData[] }>(gql`
    query GetEventList($sourceId: String!) {
      genericDataByExternalDataSource(externalDataSourceId: $sourceId) {
        id
        title
        description
        startTime
        endTime
        publicUrl
      }
    }
  `, {
    variables: {
      sourceId: eventDataSource?.id,
    },
    skip: !eventDataSource
  })

  if (eventData.loading) return <div className='py-4'>
    <LoadingIcon />
  </div>

  const events = eventData.data?.genericDataByExternalDataSource
    ?.filter(e => {
      return isAfter(new Date(e.startTime), new Date())
    })
    .sort((a, b) => {
      return compareAsc(new Date(a.startTime), new Date(b.startTime))
    }) || []

  if (!events.length) return (
    <div className='py-4'>
      <PuckText text={noUpcomingEventsMessage} />
    </div>
  )

  return (
    <section className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4'>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          displayEventTitles={displayEventTitles}
          displayEventDescriptions={displayEventDescriptions}
        />
      ))}
    </section>
  )
}

function EventCard ({ event, displayEventTitles, displayEventDescriptions }: { 
  event: EventData,
  displayEventTitles: boolean,
  displayEventDescriptions: boolean
}) {
  const content = (
    <div className="w-full h-full aspect-square overflow-clip rounded-[20px] flex flex-col gap-5 hover:shadow-hover transition-all">
      <div className="p-5 bg-jungle-green-600 text-white h-full relative flex flex-col gap-4 align-bottom">
        <Image src={ArrowTopRight} width={30} alt="arrow" className='relative z-10' />
        <h2 className="lg:text-hub2xl text-hubxl tracking-tight relative z-10">
          {displayEventTitles
            ? event.title
            : `${formatDate(new Date(event.startTime), "eeee do MMMM, h:mmaaa")}${event.endTime ? `-${formatDate(new Date(event.endTime), "h:mmaaa")}` : ''}`
          }
        </h2>
        {displayEventDescriptions && !!event.description && (
          <div className="text-white line-clamp-6 relative z-10">
            <PuckText text={event.description} />
          </div>
        )}
        <div className='mt-auto relative z-10'>
          <TypeBadge type="EVENT" />
        </div>
        <Image
          className="object-cover rounded-[40px] absolute top-0 left-0"
          src={CirclePattern}
          width={500}
          alt="hero image"
          layout="responsive"
        />
      </div>
    </div>
  )

  if (event.publicUrl) {
    return (
      <Link href={event.publicUrl}>{content}</Link>
    );
  }

  return content
}