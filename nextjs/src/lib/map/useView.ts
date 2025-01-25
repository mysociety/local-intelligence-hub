import { SpecificViewConfig, ViewType } from '@/app/reports/[id]/reportContext'
import { useReport } from '@/lib/map/useReport'
import { WritableDraft, produce } from 'immer'
import { parseAsString, useQueryState } from 'nuqs'

export function useView<HookVT extends ViewType>(currentViewType?: HookVT) {
  const [currentViewId, setCurrentViewId] = useQueryState('view', parseAsString)
  const { report, updateReport } = useReport()
  const currentView = currentViewId
    ? report.displayOptions.views[currentViewId]
    : Object.values(report.displayOptions.views)[0]

  return {
    currentViewId,
    setCurrentViewId,
    currentView: (currentViewType
      ? currentView?.type === currentViewType
        ? currentView
        : undefined
      : currentView) as SpecificViewConfig<HookVT> | undefined,
    updateView,
  }

  function updateView(
    cb: (draft: WritableDraft<SpecificViewConfig<HookVT>>) => void
  ) {
    if (
      !!currentViewId &&
      !!currentView &&
      (!currentViewType || currentViewType === currentView.type)
    ) {
      updateReport((draft) =>
        produce(draft.displayOptions.views[currentViewId], cb)
      )
    }
  }
}
