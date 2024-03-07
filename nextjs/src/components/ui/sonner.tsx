"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background-secondary group-[.toaster]:text-white group-[.toaster]:border-background-tertiary group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-text",
          actionButton: "group-[.toast]:bg-brand group-[.toast]:text-slate-900",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-slate-900",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
