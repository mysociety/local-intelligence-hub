import React from 'react'
import { Button, ButtonProps } from './button'

export function IconToggle({
  on,
  off,
  value,
  onChange,
  ...props
}: Omit<ButtonProps, 'on' | 'off' | 'value' | 'onChange'> & {
  on: React.ReactNode
  off: React.ReactNode
  value?: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <Button onClick={() => onChange(!value)} {...props}>
      {value ? on : off}
    </Button>
  )
}
