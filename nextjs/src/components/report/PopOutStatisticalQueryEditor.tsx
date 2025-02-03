import { StatisticsConfig } from '@/__generated__/graphql'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { WritableDraft } from 'immer'
import { BarChart2Icon } from 'lucide-react'
import { Button } from '../ui/button'
import { StatisticalQueryEditor } from './StatisticalQueryEditor'

export function PopOutStatisticalQueryEditor({
  value,
  onChange,
}: {
  value: StatisticsConfig
  onChange: (cb: (value: WritableDraft<StatisticsConfig>) => void) => void
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <BarChart2Icon className="w-4 h-4" /> Edit query
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden w-full p-0 divide-y divide-meepGray-700">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="mt-0">Edit statistical query</DialogTitle>
        </DialogHeader>
        <StatisticalQueryEditor
          value={value}
          onChange={onChange}
          allowGroupByArea
          allowGroupByColumn
        />
      </DialogContent>
    </Dialog>
  )
}
