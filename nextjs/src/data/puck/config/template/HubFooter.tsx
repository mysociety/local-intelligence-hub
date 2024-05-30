import React from 'react'

import logo from "../../../../../public/hub/logo.svg";
import Image from 'next/image'

export default function HubFooter() {
  return (
    <div className="mb-[20px] w-full h-full bg-white rounded-[20px] grid grid-cols-1 md:grid-cols-2  justify-between items-stretch  gap-10 p-5 text-jungle-green-neutral">

      <Image src={logo} width={227} height={100} alt="logo" />
      <div className=" flex flex-col gap-4" >
        <p className="text-jungle-green-neutral text-sm justify-between">Navigation</p>
        <div className='grid md:grid-cols-2 grid-cols-1 gap-2'>
          <p>Home</p>
          <p>Resources</p>
          <p>Actions</p>
          <p>Map</p>
        </div>
      </div>
      <p className='max-w-xs'>United for people, climate & nature is a campaign ran by The Climate Coalition. Learn more about us here</p>
      <div className="flex justify-between gap-2 items-end" >
        <p className="text-jungle-green-neutral text-sm text-right">Privacy Policy</p>
        <p className="text-jungle-green-neutral text-sm text-right">Built by Common Knowledge</p>
      </div>
    </div>



  )
}
