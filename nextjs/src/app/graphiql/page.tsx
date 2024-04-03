"use client"

import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import React, { useMemo } from 'react';
import 'graphiql/graphiql.css';
import { authenticationHeaders } from '@/lib/auth';

function getAuthenticatedFetcher () {
  try {
    return createGraphiQLFetcher({
      url: `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/graphql`,
      headers: authenticationHeaders()
    });
  } catch (e) {
    console.log(e)
  }
}

export default function Page () {
  const fetcher = useMemo(getAuthenticatedFetcher, [])
  if (!fetcher) return null
  return <GraphiQL fetcher={fetcher} />
}