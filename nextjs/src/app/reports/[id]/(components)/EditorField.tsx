import { twMerge } from 'tailwind-merge'

export function EditorField({
  label,
  children,
  explainer,
  labelClassName,
  onClick,
  className,
  iconClassName,
  iconComponent: IconComponent,
}: EditorFieldProps) {
  return (
    <div
      className={twMerge(onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      <div className={twMerge('flex flex-row items-center gap-2')}>
        {!!(IconComponent || label) && (
          <span
            className={twMerge(
              'flex flex-row items-center gap-2 text-sm text-white w-[200px]',
              labelClassName
            )}
          >
            {IconComponent && (
              <IconComponent
                className={twMerge('w-5 h-5 text-meepGray-200', iconClassName)}
              />
            )}
            {!!label && <div>{label}</div>}
          </span>
        )}
        {children}
      </div>
      {!!explainer && (
        <div className="text-meepGray-400 py-1 text-sm">{explainer}</div>
      )}
    </div>
  )
}

export interface EditorFieldProps {
  label?: any
  explainer?: any
  children?: any
  labelClassName?: string
  className?: string
  onClick?: () => void
  iconComponent?: React.FC<{ className?: string }>
  iconClassName?: string
}
