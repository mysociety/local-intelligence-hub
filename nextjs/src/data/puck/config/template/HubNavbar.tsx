import React from 'react'
import Image from 'next/image'

import Link from 'next/link'

import logo from "../../../../../public/hub/logo.svg";
import intersect from "../../../../../public/hub/Intersect.svg";


export default function HubNavbar() {
    return (
        <div className='flex gap-5 sticky top-0 h-[80px] z-50 justify-between items-center bg-jungle-green-bg'>
            <Image
                className="absolute top-[100%]"
                src={intersect}
                width={283}
                height={100}
                alt="hero image"
            />
            <div className='z-20'>
                <Image src={logo} width={227} height={100} alt="logo" className='pt-16' />
            </div>
            <div className='flex gap-5 text-xl'>
                <Link href="/" className="hover:bg-jungle-green-50 px-4 py-2 rounded-sm">
                    Home
                </Link>
                <Link href="/map" className="hover:bg-jungle-green-50 px-4 py-2 rounded-sm">
                    Event Map
                </Link>

            </div>


        </div>
    )
}
