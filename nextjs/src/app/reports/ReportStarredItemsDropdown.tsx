import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { StarFilledIcon } from '@radix-ui/react-icons'
import React, { useState } from 'react'
import ReportStarredItems from './[id]/(components)/ReportStarredItems'

const ReportStarredItemsDropdown: React.FC = () => {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex gap-1 items-center">
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className=" justify-between text-sm font-normal w-full hover:bg-meepGray-800 text-opacity-80 gap-1 "
          >
            <StarFilledIcon className={`h-4 w-4 shrink-0 opacity-50`} />
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent className="w-[310px]  p-0" align="end">
        <div className="p-2 ">
          <ReportStarredItems />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ReportStarredItemsDropdown
