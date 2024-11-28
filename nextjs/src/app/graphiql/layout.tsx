import { requireAuth } from "@/lib/server-auth";
import { Metadata } from "next";
import 'graphiql/graphiql.css';

export default function GraphiQL ({ children }: { children: React.ReactNode }) {
  requireAuth()
  return <div className='h-[100dvh]'>{children}</div>
}

export const metadata: Metadata = {
  title: "GraphiQL",
};