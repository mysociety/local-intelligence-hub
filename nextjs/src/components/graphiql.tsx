"use client"

import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL, GraphiQLProps } from 'graphiql';
import React, { useMemo } from 'react';
import 'graphiql/graphiql.css';
import { authenticationHeaders } from '@/lib/auth';

function getAuthenticatedFetcher () {
  try {
    return createGraphiQLFetcher({
      url: `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/graphql`,
      headers: authenticationHeaders(),
      fetch: fetch
    });
  } catch (e) {
    console.error(e)
    return createGraphiQLFetcher({
      url: `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/graphql`,
      fetch: fetch
    });
  }
}

export function GraphQLPlayground(props: Partial<GraphiQLProps>) {
  const fetcher = useMemo(getAuthenticatedFetcher, [])
  if (!fetcher) return null
  return <GraphiQL {...props} fetcher={fetcher} />
}