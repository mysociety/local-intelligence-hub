import { SwitchSmall } from '@/components/ui/switch-small'
import { EditorField, EditorFieldProps } from './EditorField'

export function EditorSwitch({
  value,
  onChange,
  ...fieldProps
}: {
  value?: boolean
  onChange: (value: boolean) => void
} & EditorFieldProps) {
  return (
    <EditorField onClick={() => onChange(!value)} {...fieldProps}>
      <SwitchSmall
        onCheckedChange={onChange}
        checked={value}
        className="ml-auto"
      />
    </EditorField>
  )
}
