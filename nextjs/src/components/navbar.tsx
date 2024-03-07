import { useEffect, useState } from 'react';
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Collapsible,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  function MappedIcon() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="29" height="43" viewBox="0 0 29 43" fill="none">
        <circle cx="14.7351" cy="14.2833" r="13.9737" fill="#678DE3" />
        <path d="M16.3481 39.9C15.6435 41.1625 13.8271 41.1625 13.1226 39.9L2.23064 20.3842C1.54355 19.153 2.43356 17.6371 3.84342 17.6371L25.6273 17.6371C27.0371 17.6371 27.9271 19.1531 27.24 20.3842L16.3481 39.9Z" fill="#678DE3" />
      </svg>
    )
  }

  function CollapsibleIcon() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M1.74599 0.12793L5.09712 3.47176L8.44825 0.12793L9.47769 1.15736L5.09712 5.53793L0.716553 1.15736L1.74599 0.12793Z" fill="white" />
      </svg>
    )
  }
  return (
    <>
      {isLoggedIn ? (
        <nav className='flex flex-row justify-start items-center p-sm gap-md'>
          <Link href='/'><MappedIcon /></Link>
          <Link href='/external-data-source-updates'>CRM Data Updates</Link>
          {isLoggedIn ? (
            <Link href="/logout" className={twMerge('ml-auto', buttonVariants({ variant: "brand" }))}>Logout</Link>
          ) : (
            <Link href="/login" className={twMerge('ml-auto', buttonVariants({ variant: "brand" }))}>Login</Link>
          )}
        </nav>
      ) : (
        <nav className="p-sm">
          <ul className="flex flex-row">
            <div className="flex flex-row justify-between items-center basis-1/2 bg-meepGray-700 rounded-lg">
              <div className="flex flex-row items-center gap-xs">
                <Link className="pl-xs" href='/'><MappedIcon />
                </Link>
                <div className="flex flex-col">
                <Link href='/'>
                  <div className="text-hLg font-PPRightGrotesk">Mapped</div>
                  <p className="text-[9px] tracking-[-0.185px]"><em>by</em> Common Knowledge</p>
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-xs p-xs">
                <Button variant="reverse">Upload data</Button>
                <p className="text-muted">or</p>
                <Input type="text" className="text-[17px] leading-[150%] rounded-lg bg-meepGray-600 w-[266px]" placeholder=" Enter postcode/constituency" />
              </div>
            </div>
            <div className="basis-1/2 flex flex-row items-center justify-end text-[17px] gap-md">
              <li className="flex gap-xs p-xs"><Link href="/features">Features</Link>
                <Collapsible>
                  <CollapsibleTrigger><CollapsibleIcon /></CollapsibleTrigger>
                </Collapsible></li>
              <li className="flex gap-xs p-xs"><Link href="/community">Community</Link>
                <Collapsible>
                  <CollapsibleTrigger><CollapsibleIcon /></CollapsibleTrigger>
                </Collapsible></li>
              <li className="flex gap-xs p-xs"><Link href="/about">About</Link>
                <Collapsible>
                  <CollapsibleTrigger><CollapsibleIcon /></CollapsibleTrigger>
                </Collapsible></li>
              <li className="flex gap-xs p-xs"><Link href="/support">Support</Link>
                <Collapsible>
                  <CollapsibleTrigger><CollapsibleIcon /></CollapsibleTrigger>
                </Collapsible></li>
              {isLoggedIn ? (
                <li><Link href="/logout" className={buttonVariants({ variant: "brand" })}>Logout</Link></li>
              ) : (
                <li>
                  <Link href="/login" className={buttonVariants({ variant: "brand" })}>Login</Link></li>
              )}
            </div>
          </ul>
        </nav>
      )}
    </>
  )
}

