import { selectedConstituencyAtom } from "@/components/report/ReportMap"
import { useAtom } from "jotai"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import  { QueryConstituencyElectionCard } from "@/components/reportsConstituencyItem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { gql, useQuery } from "@apollo/client";

export function ConstituenciesPanel () {
  const [
    selectedConstituencyId,
    setSelectedConstituency,
  ] = useAtom(selectedConstituencyAtom)

  return (
    <Card className="p-4 bg-meepGray-800 border-1 text-meepGray-200 border border-meepGray-700">
      <CardHeader>
        {/* <Tabs defaultValue="all-constituencies"> */}
          {/* <TabsList> */}
            {/* <TabsTrigger value="all-constituencies">All Constituencies</TabsTrigger> */}
            {/* {!!data?.constituency && (
              <TabsTrigger value="selected-cons-1">
                {data.constituency.name}
              </TabsTrigger>
            )}
          </TabsList> */}
          {/* <TabsContent value="all-constituencies" className="flex flex-col gap-4">
            <ConstituencyElectionCard
              name="Coventry South"
              firstIn2019="Labour"
              secondIn2019="Conservative"
              mpName="Zarah Sultana"
              mpImgUrl="https://www.localintelligencehub.com/media/person/mp_4786_7qDOwxw.jpeg"
            />
            <ConstituencyElectionCard
              name="Bury North"
              firstIn2019="Conservative"
              secondIn2019="Labour"
              mpName="James Daly"
              mpImgUrl="https://www.localintelligencehub.com/media/person/mp_4854_BxRRx9j.jpeg"
            />
            <ConstituencyElectionCard
              name="Camberwell and Peckham"
              firstIn2019="Labour"
              secondIn2019="Conservative"
              mpName="Harriet Harman"
              mpImgUrl="https://www.localintelligencehub.com/media/person/mp_150_rgMOVq7.jpeg"
            />
          </TabsContent> */}
          {!!selectedConstituencyId && (
            // <TabsContent value="selected-cons-1">
              // {/* Selected constituency */}
              <QueryConstituencyElectionCard gss={selectedConstituencyId} />
            // </TabsContent>
          )}
        {/* </Tabs> */}
      </CardHeader>
    </Card>
  )
}