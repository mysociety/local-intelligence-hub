'use client';
import { useEffect, useState } from 'react';

import { ApolloProvider } from '@apollo/client';
import { client } from '../components/apollo-client';
import "./globals.css";
import { Toaster } from '@/components/ui/sonner';
import { AreaPattern } from '@/components/areaPattern';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <ApolloProvider client={client}>
      <html lang="en">
        <body>
        {!isLoggedIn && <AreaPattern/>}
        <Navbar isLoggedIn={isLoggedIn} />
        <main className="p-lg">{children}</main>
          <Toaster />
          <Footer/>
        </body>
      </html>
    </ApolloProvider >
  );
}
