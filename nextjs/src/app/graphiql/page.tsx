"use client"

import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import React, { useMemo } from 'react';
import 'graphiql/graphiql.css';

function getAuthenticatedFetcher () {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem("jwt") : '';
    return createGraphiQLFetcher({
      url: `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/graphql`,
      headers: {
        authorization: token ? `JWT ${token}` : "",
      }
    });
  } catch (e) {
    return createGraphiQLFetcher({
      url: `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/graphql`
    });
  }
}

export default function Page () {
  const fetcher = useMemo(getAuthenticatedFetcher, [])
  if (!fetcher) return null
  return <GraphiQL fetcher={fetcher} />
}