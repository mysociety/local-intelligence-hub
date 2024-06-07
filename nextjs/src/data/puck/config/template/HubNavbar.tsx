import React from 'react'
import Image from 'next/image'

import Link from 'next/link'

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

import logo from "../../../../../public/hub/logo.svg";
import intersect from "../../../../../public/hub/Intersect.svg";
import { HubNavLink } from '@/__generated__/graphql';

function NavItems({ navLinks }: { navLinks: HubNavLink[] }) {
    return (
        <>
            {navLinks.map((navLink, i) => (
                <Link key={i} href={navLink.link} className="hover:bg-jungle-green-50 px-4 py-2 rounded-sm">
                    {navLink.label}
                </Link>
            ))}
        </>
    )
}

export default function HubNavbar({ navLinks }: { navLinks: HubNavLink[] }) {
    return (
        <>
            <div className='flex py-2 gap-5 sticky top-0  sm:h-[80px] z-50 justify-between items-center bg-jungle-green-bg'>
                <Image
                    className="hidden md:block absolute top-[99%] w-[180px] sm:w-auto"
                    src={intersect}
                    width={283}
                    height={100}
                    alt="Background placeholder"
                />
                <div className='z-20'>
                    <Link href="/">
                        <Image src={logo} width={227} height={100} alt="logo" className='w-40 md:w-auto md:mt-14' />
                    </Link>
                </div>
                <div className='sm:flex hidden items-center text-xl'>
                    <NavItems navLinks={navLinks} />
                </div>
                <div className='sm:hidden flex items-center'>   
                <Sheet>
                    <SheetTrigger className='text-lg px-4 py-2 bg-jungle-green-100 rounded'>Menu</SheetTrigger>
                    <SheetContent className='bg-jungle-green-bg text-jungle-green-800'>
                        <SheetHeader>
                            <SheetTitle className='text-jungle-green-600'>Menu</SheetTitle>
                            <SheetDescription className='flex flex-col text-2xl'>
                                <NavItems navLinks={navLinks} />
                            </SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
                </div>
            </div>
        </>
    )
}
