'use client'

import React, { useMemo } from 'react'
import { Data, Render } from "@measured/puck";
import { getPuckConfigForHostname } from '@/data/puck/ui';
import { HubRenderContextProvider } from '@/components/hub/HubRenderContext';


export default function RenderPuck({ hostname, page }: {
    page: Data;
    hostname: string;
}) {
  const conf = useMemo(() => getPuckConfigForHostname(hostname), [hostname]);

  return (
    <HubRenderContextProvider hostname={hostname}>
      <Render config={conf} data={page} />
    </HubRenderContextProvider>
  )
}