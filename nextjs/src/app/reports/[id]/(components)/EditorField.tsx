export function EditorField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-row items-center gap-2">
      <div className="text-sm text-meepGray-400 w-[200px]">{label}</div>
      {children}
    </div>
  )
}
