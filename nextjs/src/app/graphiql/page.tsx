"use client"

import { createGraphiQLFetcher } from '@graphiql/toolkit';
import { GraphiQL } from 'graphiql';
import React from 'react';
import 'graphiql/graphiql.css';

export default function Page () {
  const token = localStorage.getItem("jwt");

  const fetcher = createGraphiQLFetcher({
    url: `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/graphql`,
    headers: {
      authorization: token ? `JWT ${token}` : "",
    }
  });

  return <div className='h-[100dvh]'>
    <GraphiQL fetcher={fetcher} />
  </div>
}