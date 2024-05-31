
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
      <main className="font-publicSans sm:px-8 px-4 text-jungle-green-800 min-h-[dv100] min-w-screen h-full w-full max-w-screen-xl mx-auto">
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