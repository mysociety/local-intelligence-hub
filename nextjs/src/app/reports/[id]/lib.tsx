"use client"

import { gql } from "@apollo/client"
import ColorHash from 'color-hash'
var colorHash = new ColorHash();

export const MAP_REPORT_LAYERS_SUMMARY = gql`
  fragment MapReportLayersSummary on MapReport {
    layers {
      name
      source {
        id
        name
        isImporting
        importedDataCount
        connectionDetails {
          recordUrlTemplate
        }
      }
    }
  }
`

export const MAP_REPORT_FRAGMENT = gql`
  fragment MapReportPage on MapReport {
    id
    name
    ... MapReportLayersSummary
  }
  ${MAP_REPORT_LAYERS_SUMMARY}
`

const arr = [
  "hsl(222, 69%, 65%)",
  "hsl(305, 50%, 48%)",
]
export const layerColour = (index: any, id?: any) => {
  if (typeof index === 'number' && Number.isInteger(index) && index < arr.length) {
    return arr[index]
  }
  return colorHash.hex(id || index)
}