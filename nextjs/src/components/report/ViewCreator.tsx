import { EditorSelect } from '@/app/reports/[id]/(components)/EditorSelect'
import {
  ViewConfig,
  ViewType,
  viewUnionSchema,
} from '@/app/reports/[id]/reportContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { v4 } from 'uuid'
import { ViewIcon, dataTypeDisplay } from './ViewIcon'

export function ViewCreator() {
  const report = useReport()
  const form = useForm<ViewConfig>({
    resolver: zodResolver(viewUnionSchema),
    defaultValues: {
      type: ViewType.Map,
    },
  })
  const [open, setOpen] = useState(false)
  const view = useView()

  function submit() {
    const id = v4()
    report.updateReport((draft) => {
      draft.displayOptions.views[id] = viewUnionSchema.parse({
        id,
        type: form.getValues('type'),
      })
    })
    setTimeout(() => view.setCurrentViewId(id), 50)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-meepGray-400">
          <Plus className="w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form
          onSubmit={form.handleSubmit((d) => {
            submit()
            setOpen(false)
          })}
        >
          <DialogHeader>
            <DialogTitle>Create a new view</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <EditorSelect
                  label="Layer"
                  value={field.value}
                  options={Object.values(dataTypeDisplay)
                    .filter((dt) => dt.enabled)
                    .map((type) => ({
                      value: type.type,
                      label: (
                        <div className="flex flex-row gap-1 items-center justify-start">
                          <ViewIcon viewType={type.type} />
                          {type.defaultName}
                        </div>
                      ),
                    }))}
                  onChange={(type) =>
                    form.setValue(field.name, type as ViewType)
                  }
                />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Create view</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
