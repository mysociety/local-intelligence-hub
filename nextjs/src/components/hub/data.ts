import { atom } from "jotai"
import { MapboxGeoJSONFeature } from "mapbox-gl"

export const selectedHubSourceMarkerAtom = atom<MapboxGeoJSONFeature | null>(null)
export const selectedHubConstituencyAtom = atom<string | null>(null)
export const SIDEBAR_WIDTH = 350