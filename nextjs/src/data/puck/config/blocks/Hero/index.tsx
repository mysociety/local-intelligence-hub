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
import { motion, AnimatePresence } from 'framer-motion';

const words = ["Climate", "People", "Nature"];

const RotatingWords = () => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 4000); // Change word every 2 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <span>
      <AnimatePresence exitBeforeEnter>
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
         
        >
          {words[index]}
        </motion.div>
      </AnimatePresence>
    </span>
  );
};

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
            <h1 className="text-hub5xl flex flex-wrap gap-3">
            <span className="italic">The</span>{" "}
                <span className="text-jungle-green-400 w-[150px] flex justify-center">
                  <RotatingWords /> 
                </span>{" "}
               <span>Hub</span> 
              </h1>
            <div className="text-jungle-green-neutral text-xl">
              <PuckText text={description} />
            </div>
          </div>
          <div className="flex gap-4 border-t border-jungle-green-100 pt-4 ">
            <div className='grid grid-flow-row gap-4'>
              <Link href="/map">
                See what's happening near you
              </Link>
              <Link href="/map">
                Learn more about the hub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}