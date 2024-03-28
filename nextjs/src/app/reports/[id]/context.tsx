"use client"

import { Exact, GetMapReportQuery, MapReportInput } from "@/__generated__/graphql";
import { QueryResult } from "@apollo/client";
import { createContext, useContext, useState } from "react";

export type DisplayOptionsType = {
  showElectionData: boolean,
  showMPs: boolean,
};




export const ReportContext = createContext<{
  id: string,
  updateReport: (data: MapReportInput) => void,
  deleteReport: () => void,
  report?: QueryResult<GetMapReportQuery, Exact<{ id: string; }>>,
  displayOptions: DisplayOptionsType,
  setDisplayOptions: (options: Partial<DisplayOptionsType>) => void,
}>({
  id: '?',
  updateReport: () => {},
  deleteReport: () => {},
  displayOptions: {
    showElectionData: false,
    showMPs: false,
  },
  setDisplayOptions: () => {},
});

export const useReportContext = () => {
  const context = useContext(ReportContext);
  const { displayOptions, setDisplayOptions } = context;

  const updateDisplayOptions = (options: Partial<DisplayOptionsType>) => {
    setDisplayOptions({ ...displayOptions, ...options });
  };

  return { ...context, updateDisplayOptions };
};