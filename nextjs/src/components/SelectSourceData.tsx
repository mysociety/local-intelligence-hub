import * as React from "react";
import {
  Calendar,
  MoreHorizontal,
  Tags,
  Trash,
  User,
  Database,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EnrichmentDataSource, SourcePath } from "@/lib/data";
import { AutoUpdateConfig } from "@/__generated__/graphql";

export function SourcePathSelector({
  sources,
  value,
  setValue,
  focusOnMount = false,
}: {
  sources: Array<EnrichmentDataSource>;
  value: Pick<AutoUpdateConfig, 'source' | 'sourcePath'>;
  setValue: (source: AutoUpdateConfig['source'], sourcePath: AutoUpdateConfig['sourcePath']) => void;
  focusOnMount?: boolean;
}) {
  const [open, setOpen] = React.useState(focusOnMount);

  function labelForSourcePath(source: string, sourcePath: SourcePath) {
    const sourceDict = sources.find((s) => s.slug === source);
    if (!sourceDict) return sourcePath;
    const sourcePathDict = sourceDict.sourcePaths.find((s) => val(s) === sourcePath);
    if (!sourcePathDict) return sourcePath;
    return label(sourcePathDict)
  }

  return (
    <div className="flex w-full flex-col items-start justify-between rounded-md border py-2 px-3 sm:flex-row sm:items-center cursor-pointer hover:bg-meepGray-700 text-ellipsis overflow-hidden text-nowrap">
      <div onClick={() => setOpen(true)} className="w-full text-ellipsis overflow-hidden text-nowrap text-sm">
        {value && value.source && value.sourcePath
              ? `${labelForSourcePath(value.source, value.sourcePath)} (${value.source})`
              : "Click to select data"}
      </div>
      <CommandDialog open={open} onOpenChange={() => setOpen(false)}>
        <CommandInput placeholder="Search available data..." />
        <CommandList>
          <CommandEmpty>No data found.</CommandEmpty>
          {sources.map((source) => (
            <CommandGroup heading={source.name || source.slug}>
              {source.sourcePaths.map((sourcePath) => (
                <CommandItem
                  key={val(sourcePath)}
                  value={val(sourcePath)}
                  onSelect={() => {
                    setValue(
                      source.slug,
                      val(sourcePath),
                    );
                    setOpen(false);
                  }}
                >
                  {label(sourcePath)}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandGroup heading="Settings">
            <CommandItem>Profile</CommandItem>
            <CommandItem>Billing</CommandItem>
            <CommandItem>Settings</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
{/* 
      <Sheet>
        <SheetTrigger>
          {value && value.source && value.sourcePath
              ? `${value.source}: ${value.sourcePath}`
              : "Select data"}
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Select data</SheetTitle>
            <SheetDescription>
              {sources.map((source) => (
                <DropdownMenuSub key={source.slug}>
                  <DropdownMenuSubTrigger>
                    <Database className="mr-2 h-4 w-4" />
                    {source.name || source.slug}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="p-0">
                    <Command>
                      <CommandInput
                        placeholder="Filter available data..."
                        autoFocus={true}
                      />
                      <CommandList>
                        <CommandEmpty>No data found.</CommandEmpty>
                        <CommandGroup>
                          {source.sourcePaths.map((sourcePath) => (
                            <CommandItem
                              key={val(sourcePath)}
                              value={val(sourcePath)}
                              onSelect={() => {
                                setValue(
                                  source.slug,
                                  val(sourcePath),
                                );
                                setOpen(false);
                              }}
                            >
                              {label(sourcePath)}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet> */}
    </div>
  );
}

function label(d: SourcePath) {
  return typeof d === "string" ? d : d.label || d.value;
}

function val(d: SourcePath) {
  return typeof d === "string" ? d : d.value;
}