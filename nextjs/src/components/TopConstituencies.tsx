import { ConstituencyStatsOverviewQuery, ConstituencyStatsOverviewQueryVariables } from "@/__generated__/graphql"
import { ReportContext } from "@/app/reports/[id]/context"
import { gql, useQuery } from "@apollo/client"
import { useContext } from "react"
import { MemberElectoralInsights, Person } from "./reportsConstituencyItem"
import { getYear } from "date-fns"
import { useAtom } from "jotai"
import { selectedConstituencyAtom } from "./report/ReportMap"
import { LoadingIcon } from "./ui/loadingIcon"
import { useLoadedMap } from "@/app/reports/[id]/lib"
import { constituencyPanelTabAtom } from "@/app/reports/[id]/ConstituenciesPanel"

export function TopConstituencies() {
  const sortOptions = {
    totalCount: "Total Count",
    populationDensity: "Population Density",
    electoralPower: "Electoral Power",
  }
  const sortBy: keyof typeof sortOptions = "totalCount"

  const { id } = useContext(ReportContext)
  const constituencyAnalytics = useQuery<ConstituencyStatsOverviewQuery, ConstituencyStatsOverviewQueryVariables>(CONSTITUENCY_STATS_OVERVIEW, {
    variables: {
      reportID: id
    }
  })
  const [selectedConstituency, setSelectedConstituency] = useAtom(selectedConstituencyAtom)
  const [tab, setTab] = useAtom(constituencyPanelTabAtom)
  const map = useLoadedMap()
  
  if (constituencyAnalytics.loading && !constituencyAnalytics.data) return <div className='flex flex-row items-center justify-center p-4 gap-2'>
    <LoadingIcon size={"20px"} className='inline-block' />
    <span>Loading constituencies...</span>
  </div>

  return (
    // List of them here
    <div className='grid grid-cols-1 gap-4'>
      <div className='text-meepGray-400 text-xs'>
        Sorted by {sortOptions[sortBy]}
        {/* TODO: little dropdown */}
      </div>
      {constituencyAnalytics.data?.mapReport.importedDataCountByConstituency
      .filter(constituency => constituency.gssArea)
      .map((constituency) => (
        <div onClick={() => {
          setSelectedConstituency(constituency.gss!)
          setTab("selected")
          map.loadedMap?.fitBounds(constituency.gssArea?.fitBounds)
        }} className='cursor-pointer bg-meepGray-700 group hover:bg-meepGray-600 rounded-lg'>
          <ConstituencySummaryCard
            key={constituency.gss}
            constituency={constituency.gssArea!}
            count={constituency.count}
          />
        </div>
      ))}
    </div>
  )
}

export function ConstituencySummaryCard ({ count, constituency }: {
  constituency: NonNullable<
    ConstituencyStatsOverviewQuery["mapReport"]["importedDataCountByConstituency"][0]['gssArea']
  >
  count: number
}) {
  return (
    <div className='p-3 '>
      <h2 className='font-PPRightGrotesk text-hLgPP mb-3'>{constituency.name}</h2>
      {!!constituency.lastElection?.stats && (
        <div className='flex justify-between'>
          <div className="flex flex-col gap-1">
            <p className="text-dataName font-IBMPlexSansCondensed uppercase text-meepGray-300">
              1st in {getYear(constituency.lastElection.stats.date)}
            </p>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full`} style={{
                backgroundColor: constituency.lastElection.stats.firstPartyResult.shade || "gray"
              }}></div>
              <p className="text-dataResult font-IBMPlexMono">
                {constituency.lastElection.stats.firstPartyResult.party.replace(" Party", "")}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-dataName font-IBMPlexSansCondensed uppercase text-meepGray-300">
              2nd in {getYear(constituency.lastElection.stats.date)}
            </p>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full`} style={{
                backgroundColor: constituency.lastElection.stats.secondPartyResult.shade || "gray"
              }}></div>
              <p className="text-dataResult font-IBMPlexMono">
                {constituency.lastElection.stats.secondPartyResult.party.replace(" Party", "")}
              </p>
            </div>
          </div>
        </div>
      )}
      {!!constituency.mp?.name && (
        <div className='mb-6 mt-5'>
          <Person
            name={constituency.mp?.name}
            subtitle={constituency.mp?.party?.name}
            img={constituency.mp?.photo?.url}
          />
        </div>
      )}
      <MemberElectoralInsights
        totalCount={count}
        electionStats={constituency.lastElection?.stats}
        bg="bg-meepGray-700 group-hover:bg-meepGray-600"
      />
    </div>
  )
}

const CONSTITUENCY_STATS_OVERVIEW = gql`
  query ConstituencyStatsOverview ($reportID: ID!) {
    mapReport(pk: $reportID) {
      id
      importedDataCountByConstituency {
        label
        gss
        count
        gssArea {
          name
          fitBounds
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
            }
          }
          lastElection {
            stats {
              date
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
    }
  }
`