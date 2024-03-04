'use client';

import { useEffect, useState } from 'react';
import { Inter } from "next/font/google";
import { ApolloProvider } from '@apollo/client';
import { client } from '../components/apollo-client'; 

import Link from 'next/link';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });


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
      <body className={inter.className}>
      <nav>
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/account">Account</Link></li>
          {isLoggedIn ? (
              <li><Link href="/logout">Logout</Link></li>
            ) : (
              <li><Link href="/login">Login</Link></li>
            )}
        </ul>
      </nav>
        {children}
      </body>
    </html>
    </ApolloProvider>
  );
}
