import {
  SpecificViewConfig,
  ViewConfig,
  ViewType,
} from '@/app/reports/[id]/reportContext'
import { useReport } from '@/lib/map/useReport'
import { produce } from 'immer'
import { useQueryState } from 'nuqs'
import { useExplorer } from './state'

export function useView<HookVT extends ViewType = any>(
  desiredViewType?: HookVT
) {
  const { report, updateReport } = useReport()
  const [userSelectedCurrentViewId, __setCurrentViewId] = useQueryState(
    'view',
    {
      defaultValue: '',
      clearOnDefault: true,
    }
  )
  const explorer = useExplorer()

  const currentView: ViewConfig | null = userSelectedCurrentViewId
    ? report.displayOptions.views[userSelectedCurrentViewId]
    : report.displayOptions.views[report.displayOptions.viewSortOrder[0]]

  const currentViewOfType = desiredViewType
    ? currentView && currentView.type === desiredViewType
      ? (currentView as SpecificViewConfig<HookVT>)
      : null
    : null

  return {
    currentView,
    currentViewOfType,
    setCurrentViewId,
    updateView,
    reset,
  }

  function reset() {
    __setCurrentViewId('')
  }

  function setCurrentViewId(id: string) {
    __setCurrentViewId(id)
    explorer.hide()
  }

  function updateView(cb: (draft: SpecificViewConfig<HookVT>) => void) {
    if (currentView && currentView.type === desiredViewType) {
      updateReport((draft) => {
        draft.displayOptions.views[currentView.id] = produce(currentView, cb)
      })
    }
  }
}
