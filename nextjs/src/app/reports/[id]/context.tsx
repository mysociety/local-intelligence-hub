"use client"

import { Exact, GetMapReportQuery, MapReportInput, MapReportLayerAnalyticsQuery } from "@/__generated__/graphql";
import { QueryResult } from "@apollo/client";
import { createContext, useContext } from "react";

export const ReportContext = createContext<{
  id: string,
  updateReport: (data: MapReportInput) => void,
  deleteReport: () => void,
  report?: QueryResult<GetMapReportQuery, Exact<{ id: string; }>>
  showElectionData: boolean,
  setShowElectionData: (show: boolean) => void
}>({
  id: '?',
  updateReport: () => ({} as any),
  deleteReport: () => {},
  showElectionData: false,
  setShowElectionData: () => {}
})
export const useReportContext = () => useContext(ReportContext);
