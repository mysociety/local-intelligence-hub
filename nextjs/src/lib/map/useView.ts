import { SpecificViewConfig, ViewType } from '@/app/reports/[id]/reportContext'
import { useReport } from '@/lib/map/useReport'
import { produce } from 'immer'
import { parseAsString, useQueryState } from 'nuqs'

export function useView<HookVT extends ViewType = any>(
  desiredViewType?: HookVT
) {
  const [userSelectedCurrentViewId, setCurrentViewId] = useQueryState(
    'view',
    parseAsString
  )
  const { report, updateReport } = useReport()
  const currentView = userSelectedCurrentViewId
    ? report.displayOptions.views[userSelectedCurrentViewId]
    : Object.values(report.displayOptions.views).filter((view) =>
        desiredViewType ? view.type === desiredViewType : true
      )[0]
  const currentViewId = userSelectedCurrentViewId || currentView?.id
  const specifiedTypeCurrentView = (
    desiredViewType
      ? currentView?.type === desiredViewType
        ? currentView
        : undefined
      : currentView
  ) as SpecificViewConfig<HookVT> | undefined

  return {
    currentViewId,
    setCurrentViewId,
    currentView: specifiedTypeCurrentView,
    updateView,
  }

  function updateView(cb: (draft: SpecificViewConfig<HookVT>) => void) {
    updateReport((draft) => {
      if (currentView) {
        draft.displayOptions.views[currentViewId] = produce(currentView, cb)
      }
    })
  }
}
