import React from 'react'
import Image from 'next/image'
export default function Navbar() {
    return (
        <div className='flex gap-5 sticky top-0 h-[80px] z-10 justify-between items-center bg-background'>
            <Image
                className="absolute top-[100%]"
                src="/hub/intersect.svg"
                width={283}
                height={100}
                alt="hero image"
            />
            <div className='z-20'>
                <Image src='/hub/logo.svg' width={227} height={100} alt="logo" className='pt-16' />
            </div>
            <div className='flex gap-5 text-xl'>
                <p>Get Involved</p>
                <p>Actions</p>
                <p>Resources</p>
                <p>Event Map</p>
            </div>


        </div>
    )
}
