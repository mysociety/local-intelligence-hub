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
  icon,
  onChange,
  disabled,
  disabledMessage,
  ...fieldProps
}: {
  value?: string
  options: string[] | { label?: any; value: string }[]
  icon?: React.ReactNode
  onChange: (value: string) => void
  disabled?: boolean
  disabledMessage?: string
} & EditorFieldProps) {
  return (
    <EditorField {...fieldProps}>
      <Select onValueChange={onChange} value={value} disabled={disabled}>
        <SelectTrigger
          className="border-none text-meepGray-100 font-medium p-0 my-0 text-left"
          {...(!!icon ? { hideIcon: true } : {})}
        >
          {!!disabled && !!disabledMessage ? (
            disabledMessage
          ) : (
            <>{!icon ? <SelectValue className="my-0 py-0" /> : icon}</>
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
