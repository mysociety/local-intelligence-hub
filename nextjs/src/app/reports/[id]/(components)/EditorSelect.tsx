import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  options:
    | string[]
    | { label?: any; value: string }[]
    | { label: string; options: { label: string; value: string }[] }[]
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
            if (typeof key === 'object' && 'options' in key) {
              if (key.options.length === 0) {
                return null
              }
              return (
                <SelectGroup key={key.label} title={key.label} className="my-5">
                  <SelectLabel className="text-meepGray-400 uppercase font-medium">
                    {key.label}
                  </SelectLabel>
                  {key.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )
            } else {
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
            }
          })}
        </SelectContent>
      </Select>
    </EditorField>
  )
}
