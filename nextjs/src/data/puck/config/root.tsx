"use client"

import { DefaultRootProps } from "@measured/puck";
import { ReactNode } from "react";
import { BasicLayout } from "./client";
import HubNavbar from "./template/HubNavbar";
import HubFooter from "./template/HubFooter";
import { twMerge } from "tailwind-merge";
import { GetPageQuery, GetPageQueryVariables, HubNavLink } from "@/__generated__/graphql";
import { useQuery } from "@apollo/client";
import { GET_PAGE } from "@/app/hub/render/[hostname]/query";
import { useHubRenderContext } from "@/components/hub/HubRenderContext";
import { getColors } from "theme-colors";

export type RootProps = {
  children?: ReactNode;
  title?: string;
  fullScreen?: boolean;
  navLinks?: HubNavLink[];
} & DefaultRootProps;

export default function Root({
  children,
  editMode,
  navLinks = [],
  fullScreen = false,
}: RootProps) {
  const hub = useHubRenderContext()
  const hostname = typeof window !== "undefined" ? window.location.hostname : hub.hostname
  const pageQuery = useQuery<GetPageQuery, GetPageQueryVariables>(GET_PAGE, {
    variables: {
      hostname,
    },
    skip: !!navLinks?.length || typeof window === "undefined",
  });

  let links = navLinks.length ? navLinks : pageQuery.data?.hubPageByPath?.hub.navLinks || [];
  
  const primaryColours = getColors(pageQuery.data?.hubPageByPath?.hub.primaryColour || hub.hubData?.primaryColour || "#0f8c6c");
  const secondaryColours = getColors(pageQuery.data?.hubPageByPath?.hub.secondaryColour || hub.hubData?.secondaryColour || "#0f8c6c");
  
  if (hostname === "peopleclimatenature.org") {
    return (
      <>
        <style key="generated-colors">
          {`
            :root {
              ${Object.entries(primaryColours).map(([key, value]) => `--primary-${key}: ${value};`).join("\n")}
              ${Object.entries(secondaryColours).map(([key, value]) => `--secondary-${key}: ${value};`).join("\n")}
            }
          `}
        </style>
        <style key="hardcodedCss">
          {`
            html, body {
              background: #f2f2f2;
            }
          `}
        </style>
        <style key="customCss">{hub.hubData?.customCss || ""}</style>
        <main
          className={twMerge(
            "font-publicSans text-hub-primary-800 min-w-screen h-full w-full mx-auto relative overflow-clip",
            fullScreen
              ? "h-dvh flex flex-col px-2 md:px-4"
              : "max-w-screen-xl min-h-[dv100] px-2 md:px-4 lg:px-6 xl:px-8",
          )}
        >
          <header className="sticky top-0 z-50 ">
            <HubNavbar navLinks={links} />
          </header>
          <div
            className={twMerge(
              "rounded-2xl",
              fullScreen && "h-full flex-grow mb-2 md:mb-4 overflow-hidden",
            )}
          >
            {children}
          </div>
          {!fullScreen && <HubFooter />}
        </main>
      </>
    );
  } else {
    return (
      <>
        <style key="generated-colors">
          {`
            :root {
              ${Object.entries(primaryColours).map(([key, value]) => `--primary-${key}: ${value};`).join("\n")}
              ${Object.entries(secondaryColours).map(([key, value]) => `--secondary-${key}: ${value};`).join("\n")}
            }
          `}
        </style>
        <style key="hardcodedCss">
          {`
          html, body {
            background: hsl(var(--background));
            color: hsl(var(--text));
          }
        `}
        </style>
        <style key="customCss">{hub.hubData?.customCss || ""}</style>
        <main
          className={twMerge(
            "min-w-screen h-full w-full mx-auto relative overflow-clip",
            fullScreen
              ? "h-dvh flex flex-col"
              : "min-h-[dv100]",
          )}
        >
          <div
            className={twMerge(
              fullScreen && "h-full flex-grow overflow-hidden",
            )}
          >
            {children}
          </div>
          {!fullScreen && <HubFooter />}
        </main>
      </>
    )
  }
}
