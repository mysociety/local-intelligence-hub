import { Input } from '@/components/ui/input'
import { ChangeEventHandler } from 'react'
import { EditorField, EditorFieldProps } from './EditorField'

export function EditorTextInput({
  value,
  onChange,
  disabled,
  disabledMessage,
  valueClassName,
  inputProps,
  ...fieldProps
}: {
  value?: string | null
  onChange: ChangeEventHandler<HTMLInputElement>
  disabled?: boolean
  disabledMessage?: string
  valueClassName?: string
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
} & EditorFieldProps) {
  return (
    <EditorField {...fieldProps}>
      <Input
        className="text-xs h-6"
        value={value || undefined}
        onChange={onChange}
        disabled={disabled}
        {...inputProps}
      />
    </EditorField>
  )
}
