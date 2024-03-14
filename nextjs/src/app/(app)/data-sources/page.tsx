import { useRequireAuth } from "@/hooks/auth";
import ExternalDataSourceUpdates from "./ExternalDataSourceUpdates";
import { Metadata } from "next";

export default async function Page() {
  await useRequireAuth();

  return <ExternalDataSourceUpdates />;
}

export const metadata: Metadata = {
  title: "Your Data Sources",
};