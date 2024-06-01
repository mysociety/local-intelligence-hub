/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ComponentConfig, Field, Fields } from "@measured/puck";

import CirclePattern from "../../../../../../public/hub/circle-pattern.svg";
import Image from "next/image";
import ArrowTopRight from "../../../../../../public/hub/arrow-top-right.svg";
import Link from "next/link";
import { PuckText } from "../../components/PuckText"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";



import dynamic from "next/dynamic";
import dynamicIconImports from "lucide-react/dynamicIconImports";

const icons = Object.keys(dynamicIconImports).reduce((acc, iconName) => {
  // @ts-ignore
  const El = dynamic(dynamicIconImports[iconName]);

  return {
    ...acc,
    [iconName]: <El />,
  };
}, {});

const iconOptions = Object.keys(dynamicIconImports).map((iconName) => ({
  label: iconName,
  value: iconName,
}));

export type CardProps = {
  title: string;
  behaviour: string;
  dialogDescription?: string;
  description?: string;
  type: string;
  link?: string;
  linkLabel?: string;
};

const TypeBadge = ({ type }: { type: string }) => {
  return (
    <div>
      <div className=" uppercase inline-block text-jungle-green-700 bg-jungle-green-100 font-normal rounded-full py-1 px-3">{type}</div>
    </div>
  );
}

export const Card: ComponentConfig<CardProps> = {
  resolveFields: (data) => {
    const fields: Fields<CardProps> = {
      type: {
        type: "select",
        options: [
          { label: "Resource", value: "resource" },
          { label: "Action", value: "action" },
          // { label: "Tweet", value: "tweet" },
        ],
      },
      behaviour: {
        type: "select",
        options: [
          { label: "Link", value: "link" },
          { label: "Dialog", value: "dialog" },
          { label: "No action", value: "nothing" },
        ],
      },
      title: {
        type: "text"
      },
      description: {
        type: "textarea",
      },
      dialogDescription: {
        // @ts-ignore
        visible: data.props.behaviour === "dialog",
        label: "Visible when clicked",
        type: "textarea",
      },
      link: {
        // @ts-ignore
        visible: data.props.behaviour !== "nothing",
        type: "text",
      },
      linkLabel: {
        // @ts-ignore
        visible: data.props.behaviour === "dialog",
        type: "text",
      }
    }

    for (const key of Object.keys(fields)) {
      // @ts-ignore
      if (fields[key].visible === false) {
        // @ts-ignore
        delete fields[key]
      }
    }
    
    return fields
  },
  defaultProps: {
    title: "Heading",
    dialogDescription: "",
    description: "Dignissimos et eos fugiat. Facere aliquam corrupti est voluptatem veritatis amet id. Nam repudiandae accusamus illum voluptatibus similique consequuntur. Impedit ut rerum quae. Dolore qui mollitia occaecati soluta numquam. Non corrupti mollitia libero aut atque quibusdam tenetur.",
    type: "resource",
    link: "www.google.com",
    linkLabel: "Learn more",
    behaviour: "link",
  },
  resolveData: (data, { lastData }) => {
    return {
      ...data,
      linkLabel: data.props.type === lastData?.props?.type ? data.props.linkLabel : (
        data.props.type === "resource" ? "Download" : "Learn more"
      )
    }
  },
  render: ({ title, behaviour, dialogDescription, description, type, link, linkLabel }) => {
    const content = (
      <div className="w-full h-full aspect-square overflow-clip rounded-[20px] flex flex-col gap-5 hover:shadow-hover transition-all">
        {type === "resource" && (
          <div className="p-5 bg-white h-full flex flex-col gap-4 justify-between">
            <div className="flex flex-col gap-4">
              <h2 className="lg:text-hub2xl text-hubxl">{title}</h2>
              {description && <div className="text-jungle-green-neutral line-clamp-6">
                <PuckText text={description} />
              </div>}
            </div>
            <TypeBadge type={type} />
          </div>
        )}
  
        {type === "action" && (
          <div className="p-5 bg-jungle-green-600 text-white h-full relative gap-2 flex flex-col align-bottom">
            <Image src={ArrowTopRight} width={30} alt="arrow" />
            <div className="z-10">
              <h2 className="lg:text-hub2xl text-hubxl tracking-tight">{title}</h2>
              {description && (
                <div className="text-white line-clamp-6 my-4">
                  <PuckText text={description} />
                </div>
              )}
              <div className='mt-auto'>
                <TypeBadge type={type} />
              </div>
            </div>
            <Image
              className="object-cover rounded-[40px] absolute top-0 left-0"
              src={CirclePattern}
              width={500}
              alt="hero image"
              layout="responsive"
            />
          </div>
        )}
      </div>
    );

    if (behaviour === "link" && link) {
      return (
        <Link href={link}>
          {content}
        </Link>
      )
    }

    if (behaviour === "dialog" && !!dialogDescription) {
      return (
        <Dialog>
          <DialogTrigger className="w-full h-full text-left">
            <div className="w-full h-full aspect-square overflow-clip rounded-[20px] flex flex-col gap-5 hover:shadow-hover transition-all">
              {type === "resource" && (
                <div className="p-5 bg-white h-full flex flex-col gap-4 justify-between">
                  <div className=" flex flex-col gap-4" >
                    <h2 className="lg:text-hub2xl text-hubxl">{title}</h2>
                    {description && (
                      <div className="text-jungle-green-neutral line-clamp-6">
                        <PuckText text={description} />
                      </div>
                    )}
                  </div>
                  <TypeBadge type={type} />
                </div>
              )}

              {type === "action" && (


                <div className="p-5 bg-jungle-green-600 text-white h-full relative gap-2 flex flex-col align-bottom">
                  <Image src={ArrowTopRight} width={30} alt="arrow" />
                  <div className="z-10">
                    <h2 className="lg:text-hub2xl text-hubxl tracking-tight">{title}</h2>
                    {description && (
                      <div className="text-white line-clamp-6 my-4">
                        <PuckText text={description} />
                      </div>
                    )}
                    <div>
                      <div className="uppercase inline-block text-jungle-green-700 bg-jungle-green-100 text-lg font-normal rounded-full px-3">{type}</div>
                    </div>
                  </div>
                  <Image
                    className="object-cover rounded-[40px] absolute top-0 left-0"
                    src={CirclePattern}
                    width={500}
                    layout="responsive"
                    alt="background image"
                  />
                </div>
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="p-10 bg-white text-jungle-green-900 max-h-[95dvh] overflow-y-auto">
            <DialogHeader className="flex flex-col gap-5 text-left">
              <DialogTitle className="text-5xl">{title}</DialogTitle>
              <DialogDescription className=" text-lg">
                <PuckText text={dialogDescription} />
              </DialogDescription>
              <button
                className='bg-jungle-green-600 hover:bg-jungle-green-500 text-white text-lg font-bold rounded-md p-4 flex flex-row gap-4 text-center items-center justify-center'
              >
                {type === "resource" && <Download />}
                {linkLabel || "Learn more"}
              </button>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      );
    }

    return content
  },
};
