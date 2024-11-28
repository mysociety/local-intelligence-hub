import { requireAuth } from "@/lib/server-auth";
import ExternalDataSourceList from "./ExternalDataSourceList";
import { Metadata } from "next";

export default async function Page() {
  await requireAuth();

  return <ExternalDataSourceList />;
}

export const metadata: Metadata = {
  title: "Your Data Sources",
};