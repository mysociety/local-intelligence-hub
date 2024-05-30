import { GetLocalDataQuery } from "@/__generated__/graphql";
import { formatDate, formatRelative } from "date-fns";
import { Ticket } from "lucide-react";

export function ConstituencyView ({
  data
}: {
  data: GetLocalDataQuery
}) {
  if (!data?.postcodeSearch?.constituency?.name) {
    return <div>
      <div>Nothing found.</div>
      {/* TODO: something more useful, like other constituencies that *do* have events? */}
    </div>
  }

  return (
    <>
      <div>
        &larr; Search another postcode
      </div>
      <header className='mb-4'>
        <div className='text-meepGray-500'>Your constituency is</div>
        <h2 className='text-3xl text-green-950 font-bold'>
          {data?.postcodeSearch?.constituency?.name}
        </h2>
      </header>
      <div className='mb-4'>
        Help the campaign in {data?.postcodeSearch?.constituency?.name} by coming along to one of these upcoming events:
      </div>
      <section className='space-y-4'>
        {data?.postcodeSearch?.constituency?.genericDataForHub?.map((i: any) => (
          <article key={i.id} className='border-2 border-meepGray-200 rounded-md overflow-hidden p-4'>
            <header>
              <div className='text-meepGray-500'>
                {formatRelative(new Date(i.startTime), new Date())}
              </div>
              <h3 className='font-bold text-lg'>{i.title}</h3>
            </header>
            <div className='grid grid-cols-2'>
              <div>
                <div className='text-meepGray-500'>Date/Time</div>
                <div>{formatDate(i.startTime, "EE do MMM")}</div>
              </div>
              <div>
                <div className='text-meepGray-500'>Address</div>
                <div>{i.address} {i.postcode}</div>
              </div>
            </div>
            <p>
              <b className='text-meepGray-500 font-bold'>What's this about?</b>
              &nbsp;
              {i.description}
            </p>
            {i.publicUrl && (
              <a href={i.publicUrl} target="_blank" className='bg-green-200 text-green-900 px-3 py-2 text-center w-full block rounded-md'>
                <Ticket /> More info &amp; register
              </a>
            )}
          </article>
        ))}
      </section>
    </>
  )
}