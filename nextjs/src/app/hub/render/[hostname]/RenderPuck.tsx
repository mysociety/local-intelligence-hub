'use client'

import React from 'react'
import { Config, Data, Render } from "@measured/puck";
import { conf } from '@/data/puck/config';


export default function RenderPuck({ page }: {
    page: Data;
}) {
  return (
    <Render config={conf} data={page} />
    )
}


