"use client"

import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import React, { useMemo } from 'react';
import 'graphiql/graphiql.css';

export default function Page () {
  const fetcher = useMemo(() => {
    const token = localStorage.getItem("jwt");
    return createGraphiQLFetcher({
      url: `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/graphql`,
      headers: {
        authorization: token ? `JWT ${token}` : "",
      }
    });
  }, [])

  return <GraphiQL fetcher={fetcher} />
}