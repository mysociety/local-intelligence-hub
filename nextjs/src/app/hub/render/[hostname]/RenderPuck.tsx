'use client'

import { getPuckConfigForHostname } from '@/components/data/puck/config/ui'
import { HubRenderContextProvider } from '@/components/hub/HubRenderContext'
import { Data, Render } from '@measured/puck'
import { useMemo } from 'react'

export default function RenderPuck({
  hostname,
  page,
}: {
  page: Data
  hostname: string
}) {
  const conf = useMemo(() => getPuckConfigForHostname(hostname), [hostname])

  return (
    <HubRenderContextProvider hostname={hostname}>
      <Render config={conf} data={page} />
    </HubRenderContextProvider>
  )
}
