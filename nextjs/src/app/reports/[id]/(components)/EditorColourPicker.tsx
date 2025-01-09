import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useDebounce } from '@uidotdev/usehooks'
import { LucideChevronsUpDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { EditorField } from './EditorField'

export function EditorColourPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [selectedColor, setNewColor] = useState(value)
  const debouncedColor = useDebounce(selectedColor, 500)
  useEffect(() => {
    if (value !== debouncedColor) {
      onChange(debouncedColor)
    }
  }, [debouncedColor, value])

  return (
    <EditorField label={label}>
      <Popover>
        <PopoverTrigger className="flex items-center gap-2 w-full text-white text-sm">
          <div className="rounded-md w-5 h-5" style={{ background: value }} />{' '}
          {value}{' '}
          <LucideChevronsUpDown
            size={12}
            className="cursor-pointer text-meepGray-400 ml-auto"
          />
        </PopoverTrigger>
        <PopoverContent>
          <HexColorPicker color={value} onChange={setNewColor} />
        </PopoverContent>
      </Popover>
    </EditorField>
  )
}
