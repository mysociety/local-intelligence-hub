import React from 'react'
import Image from 'next/image'

import logo from "../../../../../public/hub/logo.svg";
import intersect from "../../../../../public/hub/Intersect.svg";


export default function Navbar() {
    return (
        <div className='flex gap-5 sticky top-0 h-[80px] z-10 justify-between items-center bg-jungle-green-bg'>
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
                <p className='px-4 py-2 rounded-sm hover:bg-jungle-green-50 bg-white'>Home</p>
                <p className='px-4 py-2 rounded-sm hover:bg-jungle-green-50'>Actions</p>
                <p className='px-4 py-2 rounded-sm hover:bg-jungle-green-50'>Resources</p>
                <p className='px-4 py-2 rounded-sm hover:bg-jungle-green-50'>Event Map</p>
            </div>


        </div>
    )
}
