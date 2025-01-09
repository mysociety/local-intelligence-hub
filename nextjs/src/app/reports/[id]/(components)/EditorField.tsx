import { twMerge } from 'tailwind-merge'

export function EditorField({
  label,
  children,
  explainer,
  labelClassName,
  onClick,
  className,
}: EditorFieldProps) {
  return (
    <div className={className}>
      <div
        className={twMerge(
          'flex flex-row items-center gap-2',
          onClick && 'cursor-pointer'
        )}
        onClick={onClick}
      >
        <div
          className={twMerge(
            'text-sm  text-meepGray-400 w-[200px]',
            labelClassName
          )}
        >
          {label}
        </div>
        {children}
      </div>
      {!!explainer && (
        <div className="text-meepGray-400 py-1 text-sm">{explainer}</div>
      )}
    </div>
  )
}

export interface EditorFieldProps {
  label: any
  explainer?: any
  children?: any
  labelClassName?: string
  className?: string
  onClick?: () => void
}
