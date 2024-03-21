"use client"

import { MAP_REPORT_LAYERS_SUMMARY } from "@/components/dataConfig"
import { gql } from "@apollo/client"

export const MAP_REPORT_FRAGMENT = gql`
  fragment MapReportPage on MapReport {
    id
    name
    ... MapReportLayersSummary
  }
  ${MAP_REPORT_LAYERS_SUMMARY}
`