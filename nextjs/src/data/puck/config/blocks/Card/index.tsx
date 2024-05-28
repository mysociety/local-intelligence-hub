/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ComponentConfig } from "@measured/puck";


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
  description: string;
  type: string;
};

export const Card: ComponentConfig<CardProps> = {
  fields: {
    type: {
      type: "select",
      options: [
        { label: "Resource", value: "resource" },
        { label: "Action", value: "action" },
      ],
    },
    title: {
      type: "text",
    },
    description: {
      type: "textarea",
    },

  },
  defaultProps: {
    title: "Heading",
    description: "Dignissimos et eos fugiat. Facere aliquam corrupti est voluptatem veritatis amet id. Nam repudiandae accusamus illum voluptatibus similique consequuntur. Impedit ut rerum quae. Dolore qui mollitia occaecati soluta numquam. Non corrupti mollitia libero aut atque quibusdam tenetur.",
    type: "Type",

  },
  render: ({ title, description, type }) => {
    return (
      <Dialog>
      <DialogTrigger className="w-full h-full text-left">
        <div className="bg-white p-5  rounded-[40px] flex flex-col gap-5 justify-between h-full hover:shadow-hover transition-all">
          <h2 className="text-2xl tracking-tight">{title}</h2>
          <p className="text-hub-secondary text-lg line-clamp-4">{description}</p>
          <div>
            <div className="inline-block text-jungle-700 bg-jungle-green-100 text-md font-normal rounded-full px-3">{type}</div>
          </div>
        </div>

      </DialogTrigger>
      <DialogContent className="p-10 bg-white">
        <DialogHeader className="flex flex-col gap-5">
          <DialogTitle className="text-5xl">{title}</DialogTitle>
          <DialogDescription className="text-secondary text-lg">
          {description}
          </DialogDescription>
          <Button variant="secondary" className="gap-4"><Download />Download Files</Button>

        </DialogHeader>
      </DialogContent>
    </Dialog>
    );
  },
};
