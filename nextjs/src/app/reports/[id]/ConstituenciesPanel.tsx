import { selectedConstituencyAtom } from "@/components/report/ReportMap"
import { useAtom } from "jotai"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ReportsConsItem from "@/components/reportsConstituencyItem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { gql, useQuery } from "@apollo/client";
import { GetConstituencyDataQuery, GetConstituencyDataQueryVariables } from "@/__generated__/graphql";

export function ConstituenciesPanel () {
  const [
    selectedConstituencyId,
    setSelectedConstituency,
  ] = useAtom(selectedConstituencyAtom)

  const { data, loading, error } = useQuery<GetConstituencyDataQuery, GetConstituencyDataQueryVariables>(CONSTITUENCY_DATA, {
    variables: { gss: selectedConstituencyId },
  })

  return (
    <Card className="p-4 bg-meepGray-800 border-1 text-meepGray-200 border border-meepGray-700">
      <CardHeader>
        <Tabs defaultValue="all-constituencies">
          <TabsList>
            <TabsTrigger value="all-constituencies">All Constituencies</TabsTrigger>
            {!!data && (
              <TabsTrigger value="selected-cons-1">
                {data.area.name}
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="all-constituencies" className="flex flex-col gap-4">
            <ReportsConsItem
              consName="Coventry South"
              firstIn2019="Labour"
              secondIn2019="Conservative"
              mpName="Zarah Sultana"
              mpImgUrl="https://www.localintelligencehub.com/media/person/mp_4786_7qDOwxw.jpeg"
            />
            <ReportsConsItem
              consName="Bury North"
              firstIn2019="Conservative"
              secondIn2019="Labour"
              mpName="James Daly"
              mpImgUrl="https://www.localintelligencehub.com/media/person/mp_4854_BxRRx9j.jpeg"
            />
            <ReportsConsItem
              consName="Camberwell and Peckham"
              firstIn2019="Labour"
              secondIn2019="Conservative"
              mpName="Harriet Harman"
              mpImgUrl="https://www.localintelligencehub.com/media/person/mp_150_rgMOVq7.jpeg"
            />
          </TabsContent>
          {data?.area && (
            <TabsContent value="selected-cons-1">
              {/* Selected constituency */}
              <ReportsConsItem
                consName={data.area.name}
                firstIn2019={data.area.mp[0].party?.name || "Unknown"}
                secondIn2019="?"
                mpName={data.area.mp[0].name || "Unknown"}
                mpImgUrl="?"
              />
            </TabsContent>
          )}
        </Tabs>
      </CardHeader>
    </Card>
  )
}

const CONSTITUENCY_DATA = gql`
  query GetConstituencyData($gss: String!) {
    area(gss: $gss) {
      id
      name
      mp: people(filters:{personType:"MP"}) {
        id
        name
        party: datum(filters:{
          dataType_Name: "party"
        }) {
          name: data
        }
        last_election_majority: datum(filters:{
          dataType_Name: "mp_election_majority"
        }) {
          votes: int
        }
      }
    }
  }
`