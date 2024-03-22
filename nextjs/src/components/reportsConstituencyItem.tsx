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

import Image from "next/image";

type Party = {
  name: string;
  shade: string;
}

type DeepNullable<T> = {
  [K in keyof T]: DeepNullable<T[K]> | null;
};

export const QueryConstituencyElectionCard = ({ gss }: { gss: string }) => {

  const { data, loading, error } = useQuery<GetConstituencyDataQuery, GetConstituencyDataQueryVariables>(CONSTITUENCY_DATA, {
    variables: { gss },
  })

  if (!loading && error) return <div>Error loading constituency {gss}</div>
  if (!data?.constituency) return <div>Loading constituency...</div>

  return (
    <ConstituencyElectionCard
      name={data.constituency.name}
      firstParty2019={data.constituency.mp?.party}
      // secondParty2019={data.constituency.mp[1]?.party}
      mpName={data.constituency.mp?.name || "Unknown"}
      // mpImgUrl={data.constituency.mp?.image || ""}
    />
  )
}

const ConstituencyElectionCard = ({
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

export default ConstituencyElectionCard;


const CONSTITUENCY_DATA = gql`
  query GetConstituencyData($gss: String!) {
    constituency: area(gss: $gss) {
      id
      name
      mp: person(filters:{personType:"MP"}) {
        id
        name
        party: datum(filters:{
          dataType_Name: "party"
        }) {
          name: data
          shade
        }
        last_election_majority: datum(filters:{
          dataType_Name: "mp_election_majority"
        }) {
          votes: int
        }
      }
      lastElection {
        stats {
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