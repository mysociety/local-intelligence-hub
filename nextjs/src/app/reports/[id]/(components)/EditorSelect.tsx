import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EditorField, EditorFieldProps } from './EditorField'

export function EditorSelect({
  value,
  options,
  onChange,
  disabled,
  disabledMessage,
  ...fieldProps
}: {
  value?: string
  options: string[] | { label: string; value: string }[]
  onChange: (value: string) => void
  disabled?: boolean
  disabledMessage?: string
} & EditorFieldProps) {
  return (
    <EditorField {...fieldProps}>
      <Select onValueChange={onChange} value={value} disabled={disabled}>
        <SelectTrigger className="border-none text-meepGray-100 font-medium p-0 my-0 text-left">
          {!!disabled && !!disabledMessage ? (
            disabledMessage
          ) : (
            <SelectValue className="my-0 py-0" />
          )}
        </SelectTrigger>
        <SelectContent>
          {options.map((key) => {
            const label = typeof key === 'object' ? key.label : key
            const value = typeof key === 'object' ? key.value : key
            return (
              <SelectItem className="font-medium" key={value} value={value}>
                {label}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </EditorField>
  )
}
