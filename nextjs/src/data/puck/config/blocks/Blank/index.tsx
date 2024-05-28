import { ComponentConfig } from "@measured/puck";
import React from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";

import heroImg from "../../../../../../public/hub/hero-img.jpg"
import { Search } from "lucide-react";

export type HeroProps = {
  title: string;
  description: string;
  something: string;
};

export const Hero: ComponentConfig<HeroProps> = {
  fields: {
    title: {
      type: "text",
    },
    description: {
      type: "textarea",
    },
    something: {
      type: "text"
    },

  },
  defaultProps: {
    title: "Heading",
    description: "Description",
    something: "Something",

  },
  render: ({ title, description, something }) => {
    return (
      <div className="">
        <div className=" rounded-[40px] grid md:grid-cols-2 grid-cols-1 overflow-clip gap-[25px]">

          <div className="flex relative">

            <Image
                className="object-cover aspect-square rounded-[40px]"
                src={heroImg}
                width={500}
                height={1000}
                alt="hero image"
                layout="responsive"
            />
          </div>
          <div className=" bg-white rounded-[40px] p-14 flex flex-col place-content-center gap-10 justify-between">
            <h1 className="text-hubH1 tracking-tight">{title}</h1>
            <p className="text-jungle-green-neutral text-xl">{description}</p>
            <div className="flex flex-col gap-2">
              <p className="text-jungle-green-neutral text-xl">{something}</p>
              <div className=" flex items-center relative ">
                <Search className="absolute ml-2" stroke="red"/>
                <Input placeholder="Enter postcode or area" className=" p-8 focus-visible:ring-0 text-3xl pl-10 placeholder:text-jungle-green-600 text-jungle-green-800 bg-jungle-green-50 border-0" />
                
              </div>
              <p className="text-jungle-green-600 text-sm">Powered using <span className="underline">Mapped</span> by Common Knowledge</p>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
