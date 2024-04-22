import * as React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SourcePath } from "@/lib/data";
import { AutoUpdateConfig, EnrichmentLayersQuery } from "@/__generated__/graphql";
import { CommandSeparator } from "cmdk";
import { DataSourceFieldLabel, DataSourceIcon } from "./DataSourceIcon";
import { twMerge } from "tailwind-merge";

export function SourcePathSelector({
  sources,
  value,
  setValue,
  focusOnMount = false,
}: {
  sources: EnrichmentLayersQuery['mappingSources'];
  value: Pick<AutoUpdateConfig, 'source' | 'sourcePath'>;
  setValue: (source: AutoUpdateConfig['source'], sourcePath: AutoUpdateConfig['sourcePath']) => void;
  focusOnMount?: boolean;
}) {
  const [open, setOpen] = React.useState(focusOnMount);

  function labelForSourcePath(source: string, sourcePath: SourcePath): string {
    const sourceDict = sources.find((s) => s.slug === source);
    if (!sourceDict) return label(sourcePath);
    const sourcePathDict = sourceDict.sourcePaths.find((s) => val(s) === sourcePath);
    if (!sourcePathDict) return label(sourcePath);
    return label(sourcePathDict)
  }

  const selectedValueSource = sources.find(s => s.slug === value.source)

  const scrollElId = React.useId()

  return (
    <div className={twMerge(
      "flex w-full flex-col items-start justify-between rounded-md border py-2 px-3 sm:flex-row sm:items-center cursor-pointer hover:bg-meepGray-700 text-ellipsis overflow-hidden text-nowrap h-[40px]",
      selectedValueSource?.externalDataSource?.crmType && "pl-1"
    )}>
      <div onClick={() => setOpen(true)} className="w-full text-ellipsis overflow-hidden text-nowrap text-sm">
        {value && value.source && value.sourcePath
          ? selectedValueSource?.externalDataSource?.crmType ? (
            <span className='inline-flex flex-row items-center gap-2'>
              <DataSourceFieldLabel
                label={value.sourcePath}
                crmType={selectedValueSource.externalDataSource?.crmType}
              />
              <span className="text-xs text-meepGray-400">
                {sourceName(value.source)}
              </span>
            </span>
          ) : (
            <span className="flex flex-row gap-2 items-center">
              <span>
                {labelForSourcePath(value.source, value.sourcePath)}
              </span>
              <span className="text-xs text-meepGray-400">
                {sourceName(value.source)}
              </span>
            </span>
          ) : (
            "Click to select data"
          )}
      </div>
      <Dialog open={open} onOpenChange={() => setOpen(false)}>
        <DialogContent className="w-full max-w-full sm:max-w-[80vw] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Data sources</DialogTitle>
            <DialogDescription>
              Pick a data source and a field to import to your member list.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-row items-start gap-3 max-h-full">
            <div className='overflow-y-auto max-h-full w-1/4 flex-shrink-0'>
                {/* List of sources - click to scroll to the source's fields */}
                {sources.map((source, i, arr) => (
                  <div key={source.slug} className="cursor-pointer">
                    <div
                      onClick={() => {
                        document.getElementById(`${scrollElId}-${source.slug}`)?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      <div>
                        <DataSourceIcon
                          crmType={source.externalDataSource?.crmType || ""}
                        />
                        &nbsp;
                        {source.name || source.slug}
                      </div>
                      <div className="text-xs text-meepGray-400">
                        {source.sourcePaths.length} fields
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div id={scrollElId} className='col-span-3 overflow-y-auto max-h-full'>
                {/* Full list of sources and fields */}
                {sources.map((source, i, arr) => (
                  <div key={source.slug} id={`${scrollElId}-${source.slug}`} className="grid grid-cols-1 gap-2">
                    <div>
                      <div>
                        <DataSourceIcon
                          crmType={source.externalDataSource?.crmType || ""}
                        />
                        &nbsp;
                        {source.name || source.slug}
                      </div>
                      <div className="text-xs text-meepGray-400">
                        {source.sourcePaths.length} fields
                      </div>
                    </div>
                    {source.sourcePaths.map((sourcePath) => (
                      <div
                        key={val(sourcePath)}
                        className="cursor-pointer"
                        onClick={() => {
                          setValue(
                            source.slug,
                            val(sourcePath),
                          );
                          setOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span>
                            {source.externalDataSource?.crmType ? (
                              <DataSourceFieldLabel
                                label={label(sourcePath)}
                                crmType={source.externalDataSource?.crmType}
                              />
                            ) : (
                              label(sourcePath)
                            )}
                          </span>
                          <span className="text-xs text-meepGray-400">
                            {description(sourcePath)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  function sourceName(source: string) {
    const sourceDict = sources.find((s) => s.slug === source);
    return sourceDict ? sourceDict.name : source;
  }
}

function label(d: SourcePath) {
  return typeof d === "string" ? d : d.label || d.value;
}

function val(d: SourcePath) {
  return typeof d === "string" ? d : d.value;
}

function description(d: SourcePath) {
  return typeof d === "string" ? "" : d.description;
}