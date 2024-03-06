'use client';

import { useEffect, useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from '../components/apollo-client';
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Link from 'next/link';
import "./globals.css";


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
          <nav>
            <ul className="flex flex-row">
              <div className="bg-card flex flex-row justify-between items-center basis-1/2">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="29" height="43" viewBox="0 0 29 43" fill="none">
                    <circle cx="14.7351" cy="14.2833" r="13.9737" fill="#678DE3" />
                    <path d="M16.3481 39.9C15.6435 41.1625 13.8271 41.1625 13.1226 39.9L2.23064 20.3842C1.54355 19.153 2.43356 17.6371 3.84342 17.6371L25.6273 17.6371C27.0371 17.6371 27.9271 19.1531 27.24 20.3842L16.3481 39.9Z" fill="#678DE3" />
                  </svg>
                  <div className="flex flex-col">
                    <li className="font-PPRightGrotesk"><Link href="/">Mapped</Link></li>
                    <p className="text-base">by Common Knowledge</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Button className="font-IBMPlexSans text-base">Upload data</Button>
                  <p>or</p>
                  <Input type="text" className="font-IBMPlexSans text-base" placeholder=" Enter postcode/constituency" /></div>
              </div>
              <div className="basis-1/2 flex flex-row items-center justify-end font-IBMPlexSans text-base">
                <li className="flex"><Link href="/features">Features</Link>
                  <Collapsible>
                    <CollapsibleTrigger><svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1.74599 0.12793L5.09712 3.47176L8.44825 0.12793L9.47769 1.15736L5.09712 5.53793L0.716553 1.15736L1.74599 0.12793Z" fill="white" />
                    </svg></CollapsibleTrigger>
                  </Collapsible></li>
                <li className="flex"><Link href="/community">Community</Link>
                  <Collapsible>
                    <CollapsibleTrigger><svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1.74599 0.12793L5.09712 3.47176L8.44825 0.12793L9.47769 1.15736L5.09712 5.53793L0.716553 1.15736L1.74599 0.12793Z" fill="white" />
                    </svg></CollapsibleTrigger>
                  </Collapsible></li>
                <li className="flex"><Link href="/about">About</Link>
                  <Collapsible>
                    <CollapsibleTrigger><svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1.74599 0.12793L5.09712 3.47176L8.44825 0.12793L9.47769 1.15736L5.09712 5.53793L0.716553 1.15736L1.74599 0.12793Z" fill="white" />
                    </svg></CollapsibleTrigger>
                  </Collapsible></li>
                <li className="flex"><Link href="/support">Support</Link>
                  <Collapsible>
                    <CollapsibleTrigger><svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1.74599 0.12793L5.09712 3.47176L8.44825 0.12793L9.47769 1.15736L5.09712 5.53793L0.716553 1.15736L1.74599 0.12793Z" fill="white" />
                    </svg></CollapsibleTrigger>
                  </Collapsible></li>
                {isLoggedIn ? (
                  <li><Link href="/login" className={buttonVariants({ variant: "outline" })}>Logout</Link></li>
                ) : (
                  <li>
                    <Link href="/login" className={buttonVariants({ variant: "outline" })}>Login</Link></li>
                )}
              </div>
            </ul>
          </nav>
          <main>{children}</main>
        </body>
      </html>
    </ApolloProvider >
  );
}
