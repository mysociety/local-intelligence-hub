import { useAtomValue } from "jotai";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect } from "react";
import { selectedHubSourceMarkerAtom } from "./data";
import { UseQueryStateReturn, parseAsInteger, parseAsString, useQueryState } from "nuqs";

export const HubRenderContext = createContext<{
    hostname: string,
    shouldZoomOut: boolean,
    isMultitenancyMode: Boolean
    postcode: string | null,
    setPostcode: UseQueryStateReturn<string, undefined>[1],
    eventId: number | null,
    setEventId: UseQueryStateReturn<number, undefined>[1]
}>({
    hostname: "",
    shouldZoomOut: false,
    isMultitenancyMode: true,
    postcode: null,
    eventId: null,
    // @ts-ignore
    setPostcode: (...args: any[]) => {},
    // @ts-ignore
    setEventId: (...args: any[]) => {}
})

export const useHubRenderContext = () => {
    const ctx = useContext(HubRenderContext)
    function reset () {
      ctx.setPostcode(null)
      ctx.setEventId(null)
    }
    function goToEventId (eventId: number) {
      reset()
      ctx.setEventId(eventId)
    }
    function goToPostcode (postcode: string) {
      reset()
      ctx.setPostcode(postcode)
    }
    return {
      ...ctx,
      goToEventId,
      goToPostcode,
      reset
    }
}

export const HubRenderContextProvider = ({ hostname, children }: { hostname: string, children: any }) => {
  const pathname = usePathname()
  const isMultitenancyMode = pathname.includes("hub/render")
  const [postcode, setPostcode] = useQueryState("postcode", parseAsString)
  const [eventId, setEventId] = useQueryState("event", parseAsInteger)
  const shouldZoomOut = !postcode && !eventId

  return (
    <HubRenderContext.Provider value={{
      hostname,
      shouldZoomOut,
      isMultitenancyMode,
      postcode,
      setPostcode,
      eventId,
      setEventId
    }}>
      {children}
    </HubRenderContext.Provider>
  )
}