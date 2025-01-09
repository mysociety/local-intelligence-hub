import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EditorField } from './EditorField'

export function EditorSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <EditorField label={label}>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger className="border-none text-meepGray-100 font-medium p-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((key) => (
            <SelectItem className="font-medium" key={key} value={key}>
              {key}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </EditorField>
  )
}
