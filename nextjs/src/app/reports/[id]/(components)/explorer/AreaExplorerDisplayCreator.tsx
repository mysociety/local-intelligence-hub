import { CRMSelection } from '@/components/CRMButtonItem'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FormField } from '@/components/ui/form'
import { useReport } from '@/lib/map/useReport'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { v4 } from 'uuid'
import { explorerDisplaySchema } from '../../reportContext'
import { EditorSelect } from '../EditorSelect'

export function DisplayCreator() {
  const report = useReport()
  const form = useForm<{ layerId: string }>()
  const [open, setOpen] = useState(false)

  function addDisplay() {
    report.updateReport((draft) => {
      const id = v4()
      draft.displayOptions.areaExplorer.displays[id] =
        explorerDisplaySchema.parse({
          id,
          layerId: form.getValues('layerId'),
        })
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-meepGray-400 mt-2">
          <Plus className="w-4" /> add display
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form
          onSubmit={form.handleSubmit((d) => {
            setOpen(false)
            if (!d.layerId) return
            addDisplay()
            setOpen(false)
          })}
        >
          <DialogHeader>
            <DialogTitle>Add a display to the area expolorer</DialogTitle>
            <DialogDescription>
              Select which data layer to display.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="layerId"
              render={({ field }) => (
                <EditorSelect
                  label="Layer"
                  value={field.value}
                  options={report.report.layers.map((layer) => ({
                    value: layer.id,
                    label: (
                      <CRMSelection
                        source={layer.sourceData}
                        displayCount={false}
                        className="max-w-36 truncate"
                      />
                    ),
                  }))}
                  onChange={(layerId) => form.setValue(field.name, layerId)}
                />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit">Add display</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
