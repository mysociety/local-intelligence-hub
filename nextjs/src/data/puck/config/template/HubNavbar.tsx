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

function NavItems() {
    return (
        <>
            <Link href="/" className="hover:bg-jungle-green-50 px-4 py-2 rounded-sm">
                Home
            </Link>
            <Link href="/map" className="hover:bg-jungle-green-50 px-4 py-2 rounded-sm">
                Near Me
            </Link>
        </>
    )
}


export default function HubNavbar() {
    return (
        <>
            <div className='flex py-2 gap-5 sticky top-0  sm:h-[80px] z-50 justify-between items-center bg-jungle-green-bg'>
                <Image
                    className="absolute top-[99%]  sm:w-auto w-[180px]"
                    src={intersect}
                    width={283}
                    height={100}
                    alt="hero image"
                />
                <div className='z-20'>
                    <Link href="/">
                        <Image src={logo} width={227} height={100} alt="logo" className='md:mt-14 w-40 sm:w-auto' />
                    </Link>
                </div>


                <div className='sm:flex hidden items-center text-xl'>
                    <NavItems />

                </div>

                <div className='sm:hidden flex items-center'>   
                <Sheet>
                    <SheetTrigger className='text-lg px-4 py-2 bg-jungle-green-100 rounded'>Menu</SheetTrigger>
                    <SheetContent className='bg-jungle-green-bg text-jungle-green-800'>
                        <SheetHeader>
                            <SheetTitle className='text-jungle-green-600'>Menu</SheetTitle>
                            <SheetDescription className='flex flex-col text-2xl'>
                                <NavItems />

                            </SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
                </div>




            </div>
        </>
    )
}
