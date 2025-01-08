import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MixerHorizontalIcon } from '@radix-ui/react-icons'
import React from 'react'
import { NAVBAR_HEIGHT } from './ReportNavbar'
import ReportConfigLegacyControls from './_ReportConfigLegacyControls'

const ReportDisplaySettings: React.FC = () => {
  return (
    <div
      id="report-display-settings"
      style={{
        top: NAVBAR_HEIGHT + 15 + 'px',
        right: '15px',
      }}
      className="fixed z-10"
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="muted">
            <MixerHorizontalIcon />
            Display
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <ReportConfigLegacyControls />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ReportDisplaySettings
