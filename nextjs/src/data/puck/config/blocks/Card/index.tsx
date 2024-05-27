/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ComponentConfig } from "@measured/puck";

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
  icon?: "Feather";
  mode: "flat" | "card";
};

export const Card: ComponentConfig<CardProps> = {
  fields: {
    title: { type: "text" },
    description: { type: "textarea" },
    icon: {
      type: "select",
      options: iconOptions,
    },
    mode: {
      type: "radio",
      options: [
        { label: "card", value: "card" },
        { label: "flat", value: "flat" },
      ],
    },
  },
  defaultProps: {
    title: "Title",
    description: "Description",
    icon: "Feather",
    mode: "flat",
  },
  render: ({ title, icon, description, mode }) => {
    return (
      <div>
        {/* @ts-ignore */}
        <div>{icons[icon]}</div>
        <div>{title}</div>
        <div>{description}</div>
      </div>
    );
  },
};
