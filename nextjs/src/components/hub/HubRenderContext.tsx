import { useAtomValue } from "jotai";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect } from "react";
import { selectedHubSourceMarkerAtom } from "./data";

export const HubRenderContext = createContext<{
    hostname: string,
    paths: string[],
    shouldZoomOut: boolean,
    postcode: string,
    selectedEventId: string,
    isMultitenancyMode: boolean
}>({
    hostname: "",
    paths: ["/"],
    shouldZoomOut: true,
    postcode: "",
    selectedEventId: "",
    isMultitenancyMode: false
})

function navigate(path: string, hostname: string, isMultitenancyMode: boolean = true) {
    const cleanedPath = path.trim().split("/").filter(Boolean).join("/")
    const calculatedPath = isMultitenancyMode ? `/${cleanedPath}` : `/hub/render/${hostname}/${cleanedPath}`
    window.history.pushState(null, "", calculatedPath)
}

export const useHubRenderContext = () => {
    const ctx = useContext(HubRenderContext)
    return {
      ...ctx,
      navigate(path: string) {
        return navigate(path, ctx.hostname, ctx.isMultitenancyMode)
      }
    }
}

export const HubRenderContextProvider = ({ hostname, children }: { hostname: string, children: any }) => {
      // To listen for any soft changes to the pathname
  // and extract a postcode
  // e.g. /map/postcode/E15QJ
  const pathname = usePathname()

  // If we are in multitenancy mode, pathnames will be at the root
  // otherwise they will be at hub/render
  const isMultitenancyMode = !pathname.includes("hub/render")
  const offset = isMultitenancyMode ? 0 : 2

  const pathnameSegments = pathname.split("/").filter(Boolean).slice(offset, pathname.length)
  
  const postcodeFromPathname = (
      pathnameSegments &&
      pathnameSegments.length === 3 &&
      pathnameSegments[1] === 'postcode'
    ) ? pathnameSegments[2].replace(/([\s ]*)/mig, "").trim() : ''
    
  const selectedMarkerState = useAtomValue(selectedHubSourceMarkerAtom)
  useEffect(() => {
    if (selectedMarkerState?.properties?.id) {
      navigate(`/map/event/${selectedMarkerState.properties.id}`, hostname, isMultitenancyMode)
    }
  }, [selectedMarkerState, isMultitenancyMode, pathname])

  const eventIdFromPathname = (
    pathnameSegments &&
    pathnameSegments.length === 3 &&
    pathnameSegments[1] === 'event'
  ) ? pathnameSegments[2] : ''

  const shouldZoomOut = pathnameSegments.length == 1 && pathnameSegments[0] == '/map'

  return (
    <HubRenderContext.Provider value={{
      hostname,
      paths: pathnameSegments,
      shouldZoomOut,
      postcode: postcodeFromPathname,
      selectedEventId: eventIdFromPathname,
      isMultitenancyMode,
      selectedMarkerState
    }}>
      {children}
    </HubRenderContext.Provider>
  )
}