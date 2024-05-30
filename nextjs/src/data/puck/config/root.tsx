
import { DefaultRootProps } from "@measured/puck";
import { ReactNode } from "react";
import { BasicLayout } from "./client";
import HubNavbar from "./template/HubNavbar";
import HubFooter from "./template/HubFooter";




export type RootProps = {
  children?: ReactNode;
  title?: string;
} & DefaultRootProps;

export default function <Root>({ children, editMode }: RootProps) {
  return (
    <>
      <style>{css}</style>
      <main className="font-publicSans px-8 text-jungle-green-800 min-h-[dv100] min-w-screen h-full w-full max-w-screen-xl mx-auto">
        <header className="sticky top-0 z-50 ">
          <HubNavbar />
        </header>
        {children}
        <HubFooter />
      </main>
    </>
  );
}

const css = `
  html, body {
    background: #f2f2f2;
  }
  `;