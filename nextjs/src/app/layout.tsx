'use client';

import { ApolloProvider } from '@apollo/client';
import { client } from '../components/apollo-client';
import "./globals.css";
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
 
  return (
    <ApolloProvider client={client}>
      <html lang="en">
        <body>
          <Navbar />
          <main className="p-lg">{children}</main>
          <Toaster />
          <Footer/>
        </body>
      </html>
    </ApolloProvider >
  );
}
