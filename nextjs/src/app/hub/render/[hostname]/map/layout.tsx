import React from 'react'
import { Metadata } from 'next';

export default async function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export const metadata: Metadata = {
  title: "Near Me"
};