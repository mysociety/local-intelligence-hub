import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog'
import { Button, buttonVariants } from './button'

export function AlertButton({
  buttonLabel,
  title,
  children,
  buttonProps,
  onConfirm = () => {},
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
}: {
  title: string
  children: React.ReactNode
  buttonLabel: string
  onConfirm?: () => void
  confirmLabel?: string
  cancelLabel?: string
  buttonProps?: React.ComponentProps<typeof Button>
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button {...buttonProps} asChild={true}>
          <span>{buttonLabel}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {children}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={buttonVariants({ variant: 'outline' })}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={buttonVariants({ variant: 'destructive' })}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
