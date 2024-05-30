import { ComponentConfig } from "@measured/puck";
import React from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";

import heroImg from "../../../../../../public/hub/hero-img.jpg"
import mapImg from "../../../../../../public/hub/hero-map-search-lg.png"

import { Search } from "lucide-react";

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
  render: ({ title, description, prompt }) => {
    return (
      <div className=" rounded-[40px] grid md:grid-cols-2 grid-cols-1 overflow-clip gap-[25px] relative mb-[25px]">
        <Image
          className="object-cover w-full rounded-[40px] absolute "
          src={heroImg}
          width={500}
          height={1000}
          alt="hero image"
          layout="responsive"
        />
        <div className="md:grid col-start-2 p-[20px] gap-0">

          <div className=" bg-jungle-green-50 rounded-[20px] p-[25px] flex flex-col place-content-center gap-10 justify-between z-10  w-full ">
            <div className="flex flex-col gap-8">
              <h1 className="text-hubH1"><span className="italic">The</span> <span className="text-jungle-green-400">Climate</span> Hub</h1>
              <p className="text-jungle-green-neutral text-xl">{description}</p>
            </div>
            <div className="flex gap-4 border-t border-jungle-green-100 pt-8 ">
              <div className="aspect-square">
                <Image
                  className="aspect-square rounded-[10px] h-full w-full"
                  src={mapImg}
                  width={100}
                  height={100}
                  alt="map-img image"
                />
              </div>
              <div className="flex flex-col gap-4">
                <p className="text-hubH4">{prompt}</p>
                <div className=" flex items-center relative text-jungle-green-600">
                  <Search className="absolute ml-2" />
                  <Input placeholder="Enter postcode or area" className=" p-8 focus-visible:ring-0 text-hubH3 placeholder:text-hubH3 pl-10 placeholder:text-jungle-green-600 bg-jungle-green-100 border-0" />
                </div>
                <p className="text-jungle-green-600 text-sm">Powered using <span className="underline">Mapped</span> by Common Knowledge</p>
              </div>
            </div>
          </div>
        </div>
      </div>


    );
  },
};