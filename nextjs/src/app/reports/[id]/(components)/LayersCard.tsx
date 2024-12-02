'use client'

import { useAtom, useSetAtom } from 'jotai'
import { BarChart3, Layers } from 'lucide-react'
import { useContext } from 'react'
import { twMerge } from 'tailwind-merge'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { contentEditableMutation } from '@/lib/html'
import {
  isConstituencyPanelOpenAtom,
  isDataConfigOpenAtom,
  selectedConstituencyAtom,
} from '@/lib/map/state'

import { reportContext } from '../context'
import DataConfigPanel from './DataConfigPanel'
import ReportActions from './ReportActions'

const LayersCard: React.FC = () => {
  const { report, updateReport } = useContext(reportContext)
  const [isDataConfigOpen, setDataConfigOpen] = useAtom(isDataConfigOpenAtom)
  const toggleDataConfig = () => setDataConfigOpen((b) => !b)
  const [isConstituencyPanelOpen, setConstituencyPanelOpen] = useAtom(
    isConstituencyPanelOpenAtom
  )
  const setSelectedConstituency = useSetAtom(selectedConstituencyAtom)

  const toggleConsData = () => {
    setConstituencyPanelOpen((b) => {
      if (b) {
        setSelectedConstituency(null)
      }
      return !b
    })
  }

  const toggles = [
    {
      icon: Layers,
      label: 'Map layers',
      enabled: isDataConfigOpen,
      toggle: toggleDataConfig,
    },
    {
      icon: BarChart3,
      label: 'Constituency data',
      enabled: isConstituencyPanelOpen,
      toggle: toggleConsData,
    },
  ]

  return (
    <div className="flex flex-col items-start gap-4 max-h-full">
      <Card className="w-[200px] p-3 bg-white border-1 border-meepGray-700 text-meepGray-800">
        <CardHeader className="flex flex-row items-start">
          <>
            <CardTitle
              id="nickname"
              className="text-hMd grow font-IBMPlexSansMedium"
              {...contentEditableMutation(
                updateReport,
                'name',
                'Untitled Report'
              )}
            >
              {report?.data?.mapReport.name}
            </CardTitle>
            <ReportActions />
          </>
        </CardHeader>
        {report?.data?.mapReport && (
          <CardContent className="mt-4 grid grid-cols-1 gap-2">
            {toggles.map(({ icon: Icon, label, enabled, toggle }) => (
              <div
                key={label}
                className="hover:bg-meepGray-100 px-0 flex flex-row gap-2 items-center overflow-hidden text-nowrap text-ellipsis cursor-pointer"
                onClick={toggle}
              >
                <div
                  className={twMerge(
                    'relative rounded inline-block h-9 w-9',
                    enabled ? 'bg-meepGray-800' : 'bg-meepGray-100'
                  )}
                >
                  <Icon
                    className={twMerge(
                      'w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                      enabled && 'text-white'
                    )}
                  />
                </div>
                {label}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
      {/* Data config card */}
      {report?.data?.mapReport && isDataConfigOpen && <DataConfigPanel />}
    </div>
  )
}

export default LayersCard
