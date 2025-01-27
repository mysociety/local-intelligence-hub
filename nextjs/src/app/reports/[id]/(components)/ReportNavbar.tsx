import ReportActions from '@/app/reports/[id]/(components)/ReportActions'
import { useReport } from '@/lib/map/useReport'

import { ViewCreator } from '@/components/report/ViewCreator'
import { dataTypeDisplay, ViewIcon } from '@/components/report/ViewIcon'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { contentEditableMutation } from '@/lib/html'
import { useExplorer, useSidebarLeftState } from '@/lib/map'
import { useView } from '@/lib/map/useView'
import { atom, useAtomValue } from 'jotai'
import { cloneDeep } from 'lodash'
import { PanelLeft, PanelRight } from 'lucide-react'
import Link from 'next/link'
import { twMerge } from 'tailwind-merge'
import { v4 } from 'uuid'
import { MappedIcon } from '../../../../components/icons/MappedIcon'
import ReportStarredItemsDropdown from '../../ReportStarredItemsDropdown'
import ReportComboBox from './ReportComboBox'

// You can set the title & href of the top left icon link based on route & context
export const navbarTitleAtom = atom('')
export const NAVBAR_HEIGHT = 48

export default function ReportNavbar() {
  const title = useAtomValue(navbarTitleAtom)
  const { updateReport, report } = useReport()
  const leftSidebar = useSidebarLeftState()
  const explorer = useExplorer()
  const viewManager = useView()

  return (
    <nav
      style={{ height: NAVBAR_HEIGHT.toString() + 'px' }}
      className="fixed top-0 left-0 w-full bg-meepGray-600 flex flex-row items-center
     justify-between px-4 shadow-md z-10 border border-b-meepGray-800"
    >
      <section className="flex flex-row items-center gap-2 w-full">
        <Link href="/reports" className="py-sm">
          <MappedIcon height={20} />
        </Link>
        <div
          className="text-white text-lg font-bold font-IBMPlexSans text-nowrap overflow-ellipsis"
          {...contentEditableMutation(
            (name) =>
              updateReport((d) => {
                d.name = name
              }),
            'Untitled Report'
          )}
        >
          {title}
        </div>
        <div className="flex gap-8 items-center w-full">
          <ReportActions />
          <PanelLeft
            onClick={leftSidebar.toggle}
            className="text-meepGray-400 w-4 h-4 cursor-pointer"
          />{' '}
          <div className="flex flex-row gap-2 items-center">
            {Object.values(report.displayOptions.views).map((view) => (
              <ContextMenu key={view.id}>
                <ContextMenuTrigger>
                  <div
                    className={twMerge(
                      'px-2 py-1 rounded-md cursor-pointer flex items-center gap-1',
                      view.id === viewManager.currentViewId
                        ? 'text-white bg-meepGray-800'
                        : 'text-meepGray-400'
                    )}
                    onClick={() => viewManager.setCurrentViewId(view.id)}
                  >
                    <ViewIcon viewType={view.type} />
                    <div
                      {...contentEditableMutation((name) => {
                        updateReport((d) => {
                          d.displayOptions.views[view.id].name = name
                        })
                      })}
                    >
                      {view.name || dataTypeDisplay[view.type].defaultName}
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  {Object.values(report.displayOptions.views).length > 1 && (
                    <ContextMenuItem
                      onClick={() => {
                        updateReport((draft) => {
                          if (draft.displayOptions.views[view.id]) {
                            delete draft.displayOptions.views[view.id]
                          } else {
                            const id = Object.entries(
                              draft.displayOptions.views
                            ).find(
                              ([id, someView]) => someView.id === view.id
                            )?.[0]
                            if (id) delete draft.displayOptions.views[id]
                          }
                        })
                      }}
                    >
                      Delete
                    </ContextMenuItem>
                  )}
                  <ContextMenuItem
                    onClick={() => {
                      updateReport((draft) => {
                        const id = v4()
                        draft.displayOptions.views[id] = cloneDeep(view)
                        draft.displayOptions.views[id].id = id
                        draft.displayOptions.views[id].name =
                          `${view.name} (Copy)`
                      })
                    }}
                  >
                    Duplicate
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
            <ViewCreator />
          </div>
          <div className="flex flex-row items-center gap-0 ml-auto">
            <ReportComboBox />
            <ReportStarredItemsDropdown />
            {!!explorer.isValidEntity(explorer.state) && (
              <PanelRight
                onClick={explorer.toggle}
                className="text-meepGray-400 w-4 h-4 cursor-pointer ml-3"
              />
            )}
          </div>
        </div>
      </section>
      <section className="flex space-x-4"> </section>
    </nav>
  )
}
