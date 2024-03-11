"use client";

import { Button } from "@/components/ui/button";
import { enrichmentDataSources } from "@/lib/data";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { ExternalDataSourceInput, GeographyTypes } from "@/__generated__/graphql";
import { Input } from "@/components/ui/input";
import { SourcePathSelector } from "@/components/SelectSourceData";
import { ArrowRight, X, XCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AutoUpdateMappingForm({
  onSubmit,
  initialData,
  children,
  saveButtonLabel = "Update",
}: {
  onSubmit: (
    data: ExternalDataSourceInput,
  ) => void;
  initialData?: ExternalDataSourceInput;
  saveButtonLabel?: string;
  children?: React.ReactNode;
}) {
  const form = useForm<ExternalDataSourceInput>({
    defaultValues: initialData,
  });
  const data = form.watch();

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control: form.control,
      name: "autoUpdateMapping",
    },
  );

  return (
    <FormProvider {...form}>
      <Form {...form}>
        <div className="space-y-7">
          <div className='max-w-md'>
            <FormItem>
              <FormLabel>Geography Column</FormLabel>
              <div className='grid grid-cols-2 gap-4 w-full'>
                {/* Postcode field */}
                <FormField
                  control={form.control}
                  name="geographyColumn"
                  render={({ field }) => (
                    <>
                      <FormControl>
                        {/* @ts-ignore */}
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </>
                  )}
                />
                <FormField
                  control={form.control}
                  name="geographyColumnType"
                  render={({ field }) => (
                    <>
                      <FormControl>
                        {/* @ts-ignore */}
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a geography type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Geography column type</SelectLabel>
                              <SelectItem value={GeographyTypes.Postcode}>Postcode</SelectItem>
                              <SelectItem value={GeographyTypes.Ward}>Ward</SelectItem>
                              <SelectItem value={GeographyTypes.Council}>Council</SelectItem>
                              <SelectItem value={GeographyTypes.Constituency}>Constituency</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </>
                  )}
              />
              </div>
            </FormItem>
          </div>
          <div>
            <table className='w-full'>
              {fields.map((field, index) => (
                <tr key={field.id} className='flex flex-row'>
                  <td className="w-1/2 grow-0  flex flex-row items-center justify-stretch">
                    <Button
                      className="flex-shrink"
                      onClick={() => {
                        remove(index);
                      }}
                    >
                      <X />
                    </Button>
                    <SourcePathSelector
                      focusOnMount
                      sources={enrichmentDataSources}
                      value={{
                        source: form.watch(`autoUpdateMapping.${index}.source`),
                        sourcePath: form.watch(`autoUpdateMapping.${index}.sourcePath`),
                      }}
                      setValue={(source, sourcePath) => {
                        form.setValue(`autoUpdateMapping.${index}.source`, source);
                        form.setValue(
                          `autoUpdateMapping.${index}.sourcePath`,
                          sourcePath,
                        );
                      }}
                    />
                  </td>
                  <td className="w-1/2 shrink-0 flex flex-row items-center justify-stretch">
                    <ArrowRight className="flex-shrink-0" />
                    <Input
                      className="flex-shrink-0 flex-grow"
                      placeholder="Destination column"
                      key={field.id} // important to include key with field's id
                      {...form.register(`autoUpdateMapping.${index}.destinationColumn`)}
                    />
                  </td>
                </tr>
              ))}
            </table>
            <Button
              onClick={() => {
                append({
                  source: "",
                  sourcePath: "",
                  destinationColumn: "",
                });
              }}
            >
              Add field
            </Button>
            <div className="flex flex-row gap-x-4 mt-6">
              {children}
              <Button
                type="submit"
                variant={"reverse"}
                onClick={() => {
                  onSubmit(data);
                }}
              >
                {saveButtonLabel}
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </FormProvider>
  );
}
