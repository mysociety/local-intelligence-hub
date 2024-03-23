import { selectedConstituencyAtom } from "@/components/report/ReportMap"
import { useAtom } from "jotai"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConstituencyElectionDeepDive } from "@/components/reportsConstituencyItem";
import { TopConstituencies } from "@/components/TopConstituencies";

export function ConstituenciesPanel () {
  const [
    selectedConstituencyId,
    setSelectedConstituency,
  ] = useAtom(selectedConstituencyAtom)

  return (
    <Card className="p-4 bg-meepGray-800 border-1 text-meepGray-200 border border-meepGray-700">
      <CardHeader>
        <Tabs defaultValue="all-constituencies">
          <TabsList>
            <TabsTrigger value="all-constituencies">All Constituencies</TabsTrigger>
            {!!selectedConstituencyId && (
              <TabsTrigger value="selected-cons-1">
                Selected
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="all-constituencies" className="flex flex-col gap-4 overflow-y-auto">
            <TopConstituencies />
          </TabsContent>
          {!!selectedConstituencyId && (
            <TabsContent value="selected-cons-1" className="overflow-y-auto">
              <ConstituencyElectionDeepDive gss={selectedConstituencyId} />
            </TabsContent>
          )}
        </Tabs>
      </CardHeader>
    </Card>
  )
}