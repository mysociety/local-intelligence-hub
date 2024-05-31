
import { DefaultRootProps } from "@measured/puck";
import { ReactNode } from "react";
import { BasicLayout } from "./client";
import HubNavbar from "./template/HubNavbar";
import HubFooter from "./template/HubFooter";
import { twMerge } from "tailwind-merge";




export type RootProps = {
  children?: ReactNode;
  title?: string;
  fullScreen?: boolean;
} & DefaultRootProps;

export default function Root({ children, editMode, fullScreen = false }: RootProps) {
  return (
    <>
      <style>{css}</style>
      <main
        className={twMerge(
          "font-publicSans text-jungle-green-800 min-w-screen h-full w-full max-w-screen-xl mx-auto relative",
          fullScreen ? 'h-dvh flex flex-col px-2 md:px-4' : "min-h-[dv100] px-2 md:px-4 lg:px-6 xl:px-8"
      )}>
        <header className="sticky top-0 z-50 ">
          <HubNavbar />
        </header>
        <div className={twMerge(
          'rounded-2xl overflow-hidden',
          fullScreen && 'h-full flex-grow mb-2 md:mb-4'
        )}>
          {children}
        </div>
        {!fullScreen && <HubFooter />}
      </main>
    </>
  );
}

const css = `
  html, body {
    background: #f2f2f2;
  }
`;