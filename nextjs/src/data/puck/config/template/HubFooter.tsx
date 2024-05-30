import React from 'react'

import logo from "../../../../../public/hub/logo.svg";
import Image from 'next/image'

export default function HubFooter() {
  return (
    <div className="mb-[20px] w-full h-full bg-white rounded-[20px] flex justify-between items-stretch  gap-5 p-5 text-jungle-green-neutral">

      <Image src={logo} width={227} height={100} alt="logo" />
      <p className='max-w-xs'>United for people, climate & nature is a campaign ran by The Climate Coalition. Learn more about us here</p>
      <div className=" flex flex-col gap-4" >
        <p className="text-jungle-green-neutral text-sm justify-between">Navigation</p>
        <div className='grid grid-cols-2 gap-2'>
          <p>Home</p>
          <p>Resources</p>
          <p>Actions</p>
          <p>Map</p>
        </div>
      </div>
        <div className="flex flex-col items-end justify-between" >
          <p className="text-jungle-green-neutral text-sm">Privacy Policy</p>
          <p className="text-jungle-green-neutral text-sm">Built by Common Knowledge</p>
        </div>
    </div>



  )
}
