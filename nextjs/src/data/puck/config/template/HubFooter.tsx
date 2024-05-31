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
          <p><a href="/">Home</a></p>
          {/* <p><a href="/">Resources</a></p>
          <p><a href="/">Actions</a></p> */}
          <p><a href="/map">Happening Near Me</a></p>
        </div>
      </div>
      <p className='max-w-xs'>
        United for People, Climate and Nature is a campaign developed by The Climate Coalition. <a href='http://theclimatecoalition.org/about'>Learn more about us here.</a>
      </p>
      <div className="flex justify-between gap-2 items-end" >
        <p className="text-jungle-green-neutral text-sm text-right">
          <a href='https://www.theclimatecoalition.org/privacy-policy'>Privacy Policy</a>
        </p>
        <p>
          <a href='https://www.theclimatecoalition.org/cookie-policy'>Cookie Policy</a>
        </p>
        <p className="text-jungle-green-neutral text-sm text-right">
          Built with <a href='https://prototype.mapped.commonknowledge.coop'>Mapped</a> by <a href='https://commonknowledge.coop'>Common Knowledge</a>
        </p>
      </div>
    </div>
  )
}
