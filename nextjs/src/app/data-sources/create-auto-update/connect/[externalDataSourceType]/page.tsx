"use client";

import { Button } from "@/components/ui/button";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApolloError, gql, useLazyQuery, useMutation } from "@apollo/client";
import { CreateAutoUpdateFormContext } from "../../NewExternalDataSourceWrapper";
import { toast } from "sonner";
import { SubmitHandler, useFieldArray, useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { LoadingIcon } from "@/components/ui/loadingIcon";
import {
  CreateAirtableSourceMutation,
  CreateAirtableSourceMutationVariables,
  DataSourceType,
  PostcodesIoGeographyTypes,
  TestAirtableSourceQuery,
  TestAirtableSourceQueryVariables,
} from "@/__generated__/graphql";

const TEST_AIRTABLE_SOURCE = gql`
  query TestAirtableSource(
    $apiKey: String!
    $baseId: String!
    $tableId: String!
  ) {
    testAirtableSource(apiKey: $apiKey, baseId: $baseId, tableId: $tableId)
  }
`;

const CREATE_AIRTABLE_SOURCE = gql`
  mutation CreateAirtableSource($AirtableSource: AirtableSourceInput!) {
    createAirtableSource(data: $AirtableSource) {
      id
      name
      healthcheck
      dataType
    }
  }
`;

type FormInputs = {
  airtable?: CreateAirtableSourceMutationVariables["AirtableSource"];
};

export default function Page({
  params: { externalDataSourceType },
}: {
  params: { externalDataSourceType: string };
}) {
  const router = useRouter();
  const context = useContext(CreateAutoUpdateFormContext);

  useEffect(() => {
    context.setStep(2)
  }, [context])

  const form = useForm<FormInputs>({
    defaultValues: {
      airtable: {
        geographyColumnType: PostcodesIoGeographyTypes.Postcode,
        dataType: context.dataType
      },
    },
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (data.airtable) {
      testAirtableConnection(data.airtable);
    } else {
      toast.error("No details provided");
    }
  };

  const source = form.watch();

  const [testSource, testSourceResult] = useLazyQuery<
    TestAirtableSourceQuery,
    TestAirtableSourceQueryVariables
  >(TEST_AIRTABLE_SOURCE, {
    variables: {
      apiKey: source.airtable?.apiKey!,
      baseId: source.airtable?.baseId!,
      tableId: source.airtable?.tableId!,
    },
  });

  const [createSource, createSourceResult] = useMutation<
    CreateAirtableSourceMutation,
    CreateAirtableSourceMutationVariables
  >(CREATE_AIRTABLE_SOURCE, {
    variables: {
      AirtableSource: source.airtable!,
    },
  });

  async function testAirtableConnection(
    airtable: CreateAirtableSourceMutationVariables["AirtableSource"],
  ) {
    const toastId = toast.loading("Testing connection...");
    const test = testSource({ variables: airtable as any })
      .then(async (d) => {
        if (d.error || !d.data?.testAirtableSource) {
          return toast.error("Connection failed", { id: toastId });
        }
        toast.loading("Saving connection...", { id: toastId });
        try {
          const source = await createSource({
            variables: { AirtableSource: airtable },
          });
          toast.success("Connection successful", { id: toastId });
        } catch (e) {
          // Check if e is ApolloError
          if (e instanceof ApolloError) {
            const description = Object.values(
              JSON.parse(e.message.replaceAll("'", '"')),
            )[0];
            return toast.error("Couldn't save connection", {
              description: description ? description.toString() : null,
              id: toastId,
            });
          } else {
            toast.error("Couldn't save details", { id: toastId });
          }
        }
      })
      .catch((e) => {
        toast.error("Connection failed", { id: toastId });
      });
  }

  if (testSourceResult.loading || createSourceResult.loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-hLg">Testing connection...</h1>
        <p className="text-meepGray-400 max-w-sm">
          Please wait whilst we try to connect to your CRM using the information
          you provided
        </p>
        <LoadingIcon />
      </div>
    );
  }

  if (
    createSourceResult.data?.createAirtableSource.healthcheck &&
    createSourceResult.data?.createAirtableSource.dataType === DataSourceType.Member
  ) {
    return (
      <div className="space-y-6">
        <h1 className="text-hLg">Connection successful</h1>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-7'>
          <Button
            variant="outline"
            onClick={() => {
              router.push(`/data-sources/`);
            }}
          >
            Back to all data sources
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              router.push(`/data-sources/inspect/${createSourceResult.data?.createAirtableSource.id}`);
            }}
          >
            View this data source
          </Button>
          {createSourceResult.data.createAirtableSource.dataType === DataSourceType.Member && (
            <Button
              onClick={() => {
                router.push(
                  `/data-sources/create-auto-update/configure/${createSourceResult.data?.createAirtableSource.id}`,
                );
              }}
            >
              Configure auto-updates
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (externalDataSourceType === "airtable") {
    return (
      <div className="space-y-7">
        <header>
          <h1 className="text-hLg">Connecting to your Airtable base</h1>
          <p className="mt-6 text-meepGray-400 max-w-sm">
            In order to send data across to your Airtable, we'll need a few
            details that gives us permission to make updates to your base, as
            well as tell us which table to update in the first place.
          </p>
        </header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-7 max-w-sm"
          >
            <hr />
            <div className='text-hSm'>About this data</div>
            <FormField
              control={form.control}
              name="airtable.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nickname</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="My members list" {...field} required />
                  </FormControl>
                  <FormDescription>
                    This will be visible to your team.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="airtable.dataType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data type</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Select onValueChange={field.onChange} defaultValue={field.value} required>
                      <SelectTrigger>
                        <SelectValue placeholder="What kind of data is this?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Type of data source</SelectLabel>
                          <SelectItem value={DataSourceType.Member}>A list of members</SelectItem>
                          <SelectItem value={DataSourceType.Other}>Other data</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4 w-full'>
              {/* Postcode field */}
              <FormField
                control={form.control}
                name="airtable.geographyColumn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geography Column</FormLabel>
                      <FormControl>
                        {/* @ts-ignore */}
                        <Input {...field} required />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="airtable.geographyColumnType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geography Type</FormLabel>
                    <FormControl>
                      {/* @ts-ignore */}
                      <Select onValueChange={field.onChange} defaultValue={field.value} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a geography type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Geography column type</SelectLabel>
                            <SelectItem value={PostcodesIoGeographyTypes.Postcode}>Postcode</SelectItem>
                            <SelectItem value={PostcodesIoGeographyTypes.Ward}>Ward</SelectItem>
                            <SelectItem value={PostcodesIoGeographyTypes.Council}>Council</SelectItem>
                            <SelectItem value={PostcodesIoGeographyTypes.Constituency}>GE2010-2019 Constituency</SelectItem>
                            <SelectItem value={PostcodesIoGeographyTypes.Constituency_2025}>GE2024 Constituency</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
            />
            </div>
            <hr />
            <div className='text-hSm'>Connection details</div>
            <FormField
              control={form.control}
              name="airtable.apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Airtable access token</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="patAB1" {...field} required />
                  </FormControl>
                  <FormDescription>
                    Make sure your token has read and write permissions for
                    table data, table schema and webhooks.{" "}
                    <a
                      className="underline"
                      target="_blank"
                      href="https://support.airtable.com/docs/creating-personal-access-tokens#:~:text=Click%20the%20Developer%20hub%20option,right%20portion%20of%20the%20screen."
                    >
                      Learn how to find your personal access token.
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="airtable.baseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base ID</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="app1234" {...field} required />
                  </FormControl>
                  <FormDescription>
                    The unique identifier for your base.{" "}
                    <a
                      className="underline"
                      target="_blank"
                      href="https://support.airtable.com/docs/en/finding-airtable-ids#:~:text=Finding%20base%20URL%20IDs,-Base%20URLs"
                    >
                      Learn how to find your base ID.
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="airtable.tableId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table ID</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="tbl1234" {...field} required />
                  </FormControl>
                  <FormDescription>
                    The unique identifier for your table.{" "}
                    <a
                      className="underline"
                      target="_blank"
                      href="https://support.airtable.com/docs/en/finding-airtable-ids#:~:text=Finding%20base%20URL%20IDs,-Base%20URLs"
                    >
                      Learn how to find your table ID.
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-row gap-x-4">
              <Button
                variant="outline"
                type="reset"
                onClick={() => {
                  router.back();
                }}
              >
                Back
              </Button>
              <Button type="submit" variant={"reverse"}>
                Test connection
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  return null;
}
