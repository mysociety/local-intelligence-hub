import { ComponentConfig, PuckContext } from "@measured/puck";
import React, { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";

import heroImg from "../../../../../../public/hub/hero-img.jpg"
import mapImg from "../../../../../../public/hub/hero-map-search-lg.png"

import { Search } from "lucide-react";
import { PuckText } from "../../components/PuckText";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type HeroProps = {
  title: string;
  description: string;
  prompt: string;
};

export const Hero: ComponentConfig<HeroProps> = {
  fields: {
    title: {
      type: "text",
    },
    description: {
      type: "textarea",
    },
    prompt: {
      type: "text"
    },

  },
  defaultProps: {
    title: "Heading",
    description: "Description",
    prompt: "Something",

  },
  render: (props) => {
    return (
      <HeroRenderer {...props} />
    )
  }
};

function HeroRenderer ({ prompt, description, }:  HeroProps) {
  const router = useRouter()
  const [postcode, setPostcode] = useState("")
  return (
    <div className=" rounded-[40px] flex flex-col lg:flex-row justify-end overflow-clip lg:gap-[25px] relative mb-[25px]">
        <Image
          className="lg:rounded-[40px] lg:absolute h-full w-full"
          src={heroImg}
          width={500}
          height={1000}
          alt="hero image"
          layout="responsive"
        />
      <div className="lg:absolute w-full ">
        </div>
      <div className="z-20 lg:w-1/2 lg:mt-0 lg:py-[20px] lg:pr-[20px] gap-0">
        <div className=" bg-jungle-green-50 lg:rounded-[20px] p-[25px] flex flex-col place-content-center gap-10 justify-between z-10  w-full ">
          <div className="flex flex-col gap-8">
            <h1 className="text-hub5xl"><span className="italic">The</span> <span className="text-jungle-green-400">Climate</span> Hub</h1>
            <div className="text-jungle-green-neutral text-xl">
              <PuckText text={description} />
            </div>
          </div>
          <div className="flex gap-4 border-t border-jungle-green-100 pt-4 ">
            {/* <div className="aspect-square">
              <Image
                className="aspect-square rounded-[10px] h-full w-full"
                src={mapImg}
                width={100}
                height={100}
                alt="map-img image"
              />
            </div> */}
            <div className="flex flex-col gap-4">
              <p className="text-hubH4">{prompt}</p>
              <form onSubmit={(e) => {
                e.preventDefault()
                router.push(`/map/postcode/${postcode}`);
              }}>
                <div className=" flex items-center relative text-jungle-green-600">
                  <Search className="absolute ml-2" />
                  <Input
                    placeholder="Enter your postcode"
                    autoComplete="postal-code"
                    className=" border-hub-foreground p-8 focus-visible:ring-0 text-3xl placeholder:text-hub4xl pl-10 placeholder:text-jungle-green-600 bg-jungle-green-100 border-0"
                    value={postcode}
                    onChange={e => setPostcode(e.target.value)}
                  />
                  <button
                    className='bg-jungle-green-600 text-white text-lg font-bold rounded-md p-4 ml-2'
                    disabled={!postcode}
                  >
                    Search
                  </button>
                </div>
              </form>
              <p className="text-jungle-green-600 text-sm">
                Powered using <Link href="https://prototype.mapped.commonknowledge.coop" className="underline">Mapped</Link> by Common Knowledge
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}