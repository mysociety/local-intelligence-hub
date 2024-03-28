import { FieldPath, FormProvider, useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { ExternalDataSourceInput, FieldDefinition, UpdateExternalDataSourceMutationVariables } from "@/__generated__/graphql";
import { PreopulatedSelectField } from "./ExternalDataSourceFields";

type FormInputs = ExternalDataSourceInput

export function UpdateExternalDataSourceFields ({
  initialData,
  connectionType,
  fieldDefinitions,
  onSubmit
}: {
  onSubmit: (
    data: ExternalDataSourceInput,
    e?: React.BaseSyntheticEvent<object, any, any> | undefined
  ) => void;
  connectionType: string;
  initialData?: ExternalDataSourceInput;
  fieldDefinitions?: FieldDefinition[] | null;
}) {
  const form = useForm<FormInputs>({
    defaultValues: initialData
  });

  function FPreopulatedSelectField ({
    name,
    label,
    placeholder,
    required = false
  }: {
    name: FieldPath<FormInputs>,
    label?: string,
    placeholder?: string
    required?: boolean
  }) {
    return (
      <PreopulatedSelectField
        name={name}
        label={label}
        placeholder={placeholder}
        fieldDefinitions={fieldDefinitions}
        control={form.control}
        connectionType={connectionType}
        required={required}
      />
    )
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid sm:grid-cols-2 gap-4 max-w-lg"
      >
        <FPreopulatedSelectField name="emailField" />
        <FPreopulatedSelectField name="phoneField" />
        <FPreopulatedSelectField name="addressField" />
        <FPreopulatedSelectField name="fullNameField" />
        <FPreopulatedSelectField name="firstNameField" />
        <FPreopulatedSelectField name="lastNameField" />
        <Button type='submit' className='mt-4'>Update</Button>
      </form>
    </FormProvider>
  )
}