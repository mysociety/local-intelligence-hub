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
import { DEFAULT_MARKER_COLOUR } from './MembersListPointMarkers'

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
          <div className="flex flex-row gap-1 mb-1">
            {PRESET_COLOURS.map((color) => (
              <div
                key={color}
                className="rounded-md grow h-6 cursor-pointer"
                style={{ background: color }}
                onClick={() => setNewColor(color)}
              />
            ))}
          </div>
          <HexColorPicker
            color={value}
            onChange={setNewColor}
            style={{
              width: '100%',
            }}
          />
        </PopoverContent>
      </Popover>
    </EditorField>
  )
}

const PRESET_COLOURS = [DEFAULT_MARKER_COLOUR, '#FDE047', '#F87171', '#4ADE80']
