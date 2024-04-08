"use client"

import { gql } from "@apollo/client"
import ColorHash from 'color-hash'
import { atom, useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { useMap } from "react-map-gl";
var colorHash = new ColorHash();

export const MAP_REPORT_LAYERS_SUMMARY = gql`
  fragment MapReportLayersSummary on MapReport {
    layers {
      id
      name
      sharingPermission {
        visibilityRecordDetails
        visibilityRecordCoordinates
        organisation {
          name
        }
      }
      source {
        id
        name
        isImportScheduled
        importedDataCount
        recordUrlTemplate
        crmType
        dataType
        organisation {
          name
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

export const mapHasLoaded = atom(false)
export const isDataConfigOpenAtom = atom(false)
export const isConstituencyPanelOpenAtom = atom(false)

export function useLoadedMap () {
  const [loaded, setLoaded] = useAtom(mapHasLoaded)
  const map = useMap()
  // const intervalRef = useRef<NodeJS.Timeout>()
  useEffect(() => {
    if (loaded || !map.default) return
    map.default?.on('load', () => {
      setLoaded(true)
    })
  }, [map, loaded, setLoaded])
  return {
    ...map,
    loadedMap: loaded ? map.default : null,
    loaded,
  }
}