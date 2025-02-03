import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { twMerge } from 'tailwind-merge'
import { EditorField, EditorFieldProps } from './EditorField'

export function EditorSelect({
  value,
  options,
  onChange,
  disabled,
  disabledMessage,
  valueClassName,
  ...fieldProps
}: {
  value?: string | null
  options: string[] | { label?: any; value: string }[]
  onChange: (value: string) => void
  disabled?: boolean
  disabledMessage?: string
  valueClassName?: string
} & EditorFieldProps) {
  return (
    <EditorField {...fieldProps}>
      <Select
        onValueChange={onChange}
        value={value || undefined}
        disabled={disabled}
      >
        <SelectTrigger className="w-full border border-meepGray-700 rounded-sm text-meepGray-100 font-medium px-2 my-0 h-8 text-left truncate overflow-hidden">
          {!!disabled && !!disabledMessage ? (
            disabledMessage
          ) : (
            <SelectValue
              className={twMerge('my-0 py-0 max-w-[220px]', valueClassName)}
            />
          )}
        </SelectTrigger>
        <SelectContent>
          {options.map((key) => {
            const label = typeof key === 'object' ? key.label : key
            const value = typeof key === 'object' ? key.value : key
            return (
              <SelectItem
                className={twMerge('font-medium', valueClassName)}
                key={value}
                value={value}
              >
                {label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </EditorField>
  )
}
