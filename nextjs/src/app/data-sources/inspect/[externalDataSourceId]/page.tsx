import { useRequireAuth } from "@/hooks/auth";
import InspectExternalDataSource from "./InspectExternalDataSource";

export default async function Page({
  params: { externalDataSourceId },
}: {
  params: { externalDataSourceId: string };
}) {
  await useRequireAuth();

  return (
    <InspectExternalDataSource
      externalDataSourceId={externalDataSourceId}
    />
  );
}
