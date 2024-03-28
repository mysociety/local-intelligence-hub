"use client"

import { Exact, GetMapReportQuery, MapReportInput, MapReportLayerAnalyticsQuery } from "@/__generated__/graphql";
import { QueryResult } from "@apollo/client";
import { createContext } from "react";

export const ReportContext = createContext<{
  id: string,
  updateReport: (data: MapReportInput) => void,
  deleteReport: () => void,
  report?: QueryResult<GetMapReportQuery, Exact<{ id: string; }>>
}>({
  id: '?',
  updateReport: () => ({} as any),
  deleteReport: () => {}
})