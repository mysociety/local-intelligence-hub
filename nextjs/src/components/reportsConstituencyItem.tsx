import { GetConstituencyDataQuery, GetConstituencyDataQueryVariables } from "@/__generated__/graphql";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { gql, useQuery } from "@apollo/client";
import { getYear } from "date-fns";
import { format } from 'd3-format'

import Image from "next/image";

type Party = {
  name: string;
  shade: string;
}

type DeepNullable<T> = {
  [K in keyof T]: DeepNullable<T[K]> | null;
};

export const ConstituencyElectionDeepDive = ({ gss }: { gss: string }) => {

  const { data, loading, error } = useQuery<GetConstituencyDataQuery, GetConstituencyDataQueryVariables>(CONSTITUENCY_DATA, {
    variables: { gss },
  })

  if (!loading && error) return <div>Error loading constituency {gss}</div>
  if (!data?.constituency) return <div>Loading constituency...</div>

  return (
    <div key={data.constituency.id}>
      <h1 className='font-PPRightGrotesk text-hLgPP'>{data.constituency.name}</h1>
      <hr className='my-4' />
      {data.constituency.mp && (
        <section className='mb-8'>
          <div className='uppercase font-IBMPlexMono text-xs text-meepGray-400 mb-1'>
            MP
          </div>
          <Person
            img={data.constituency.mp.photo?.url}
            name={data.constituency.mp.name}
            subtitle={data.constituency.mp.party?.name}
          />
        </section>
      )}
      {!!data.constituency.lastElection && (
        <section className='font-IBMPlexMono space-y-6'>
          <section>
            {/* First and second parties */}
            <article className='relative z-10 space-y-1'>
              <div className='uppercase text-xs text-meepGray-400'>
                1st in {getYear(data.constituency.lastElection.stats.date)}
              </div>
              <div>{data.constituency.lastElection.stats.firstPartyResult.party}</div>
              <div className='rounded w-full h-4' style={{ backgroundColor: data.constituency.lastElection.stats.firstPartyResult.shade }} />
            </article>
            <article className='relative z-10 pt-6'>
              <div
                aria-roledescription="Margin between first and second party votes"
                className='bg-meepGray-700 border-l border-r border-meepGray-400 absolute right-0 top-0 h-full z-0'
                style={{
                  width: format(".0%")(
                    1 - (
                      data.constituency.lastElection.stats.secondPartyResult.votes /
                      data.constituency.lastElection.stats.firstPartyResult.votes
                    )
                  )
                }}
              />
              <div className='relative z-10 space-y-1'>
                <div className='uppercase text-xs text-meepGray-400'>
                  2nd in {getYear(data.constituency.lastElection.stats.date)}
                </div>
                <div>{data.constituency.lastElection.stats.secondPartyResult.party}</div>
                <div className='rounded h-4' style={{
                  backgroundColor: data.constituency.lastElection.stats.secondPartyResult.shade,
                  width: format(".0%")(
                    data.constituency.lastElection.stats.secondPartyResult.votes /
                    data.constituency.lastElection.stats.firstPartyResult.votes
                  )
                }} />
              </div>
            </article>
          </section>
          <section className='grid grid-cols-2 gap-6'>
            {/* Voting stats */}
            <article>
              <div className='uppercase text-xs text-meepGray-400'>Majority</div>
              <div>{format(",")(data.constituency.lastElection.stats.majority)}</div>
            </article>
            <article>
              <div className='uppercase text-xs text-meepGray-400'>Swing to lose</div>
              <div>{format(".2%")(data.constituency.lastElection.stats.majority / data.constituency.lastElection.stats.electorate)}</div>
            </article>
            <article>
              <div className='uppercase text-xs text-meepGray-400'>Electorate</div>
              <div>{format(",")(data.constituency.lastElection.stats.electorate)}</div>
            </article>
            <article>
              <div className='uppercase text-xs text-meepGray-400'>Turnout</div>
              <div>{format(".2%")(data.constituency.lastElection.stats.validVotes / data.constituency.lastElection.stats.electorate)}</div>
            </article>
          </section>
        </section>
      )}
    </div>
  )
}

export function Person ({ img, name, subtitle }: { img?: string, name: string, subtitle?: string }) {
  return (
    <div className='flex flex-row items-center gap-2'>
      {!!img && (
        // <Image src={img} alt={name} width={41} height={41} className='rounded-full' />
        <img
          src={new URL(img, process.env.NEXT_PUBLIC_BACKEND_BASE_URL).toString()}
          alt={name} width={41} height={41} className='rounded-full'
        />
      )}
      <div className='font-IBMPlexMono -space-y-1'>
        <div>{name}</div>
        {!!subtitle && <div className='text-meepGray-400'>{subtitle}</div>}
      </div>
    </div>
  )
}

export const ConstituencyElectionCard = ({
  name, firstParty2019, secondParty2019, mpName, mpImgUrl
}: {
  name: string;
  firstParty2019?: Partial<DeepNullable<Party>> | null;
  secondParty2019?: Partial<DeepNullable<Party>> | null;
  mpName?: string;
  mpImgUrl?: string;
}) => {
  return (
    <Card className="p-4 bg-meepGray-700 text-white">
      <CardHeader>
        <CardTitle className="font-PPRightGrotesk text-hLgPP mb-4 ">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex gap-6">
          {!!firstParty2019 && (
            <div className="flex flex-col gap-1">
              <p className="text-dataName font-IBMPlexSansCondensed uppercase text-meepGray-300">First in 2019</p>
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full`} style={{
                  backgroundColor: firstParty2019.shade || "gray"
                }}></div>
                <p className="text-dataResult font-IBMPlexMono">
                  {firstParty2019.name}
                </p>
              </div>
            </div>
          )}
          {!!firstParty2019 && !!secondParty2019 && (
            <div className="flex flex-col gap-1">
              <p className="text-dataName font-IBMPlexSansCondensed uppercase text-meepGray-300">Second in 2019</p>
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full`} style={{
                  backgroundColor: secondParty2019.shade || "gray"
                }}></div>
                <p className="text-dataResult font-IBMPlexMono">
                  {secondParty2019.name}
                </p>
              </div>
            </div>
          )}
        </div>
        {mpName && (
          <div className="flex flex-col gap-1">
            <p className="text-dataName font-IBMPlexSansCondensed uppercase text-meepGray-300 mb-2">
              Member of Parliment
            </p>
            <div className="flex items-center gap-1">
              {mpImgUrl && (
                <Image
                  className="rounded-full"
                  src={mpImgUrl}
                  width="50"
                  height="50"
                  alt=""
                />
              )}
              <div className="flex flex-col gap-1">
                <p className="text-dataResult font-IBMPlexMono">{mpName}</p>
                <p className="text-xs Name font-IBMPlexMono uppercase text-meepGray-400">
                  {firstParty2019?.name}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
      </CardFooter>
    </Card>
  )
};


const CONSTITUENCY_DATA = gql`
  query GetConstituencyData($gss: String!) {
    constituency: area(gss: $gss) {
      id
      name
      mp: person(filters:{personType:"MP"}) {
        id
        name
        photo {
          url
        }
        party: datum(filters:{
          dataType_Name: "party"
        }) {
          name: data
          shade
        }
      }
      lastElection {
        stats {
          date
          electorate
          validVotes
          majority
          firstPartyResult {
            party
            shade
            votes
          }
          secondPartyResult {
            party
            shade
            votes
          }
        }
      }
    }
  }
`