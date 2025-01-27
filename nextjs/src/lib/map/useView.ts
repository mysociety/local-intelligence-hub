import { SpecificViewConfig, ViewType } from '@/app/reports/[id]/reportContext'
import { useReport } from '@/lib/map/useReport'
import { WritableDraft, produce } from 'immer'
import { parseAsString, useQueryState } from 'nuqs'

export function useView<HookVT extends ViewType>(desiredViewType?: HookVT) {
  const [userSelectedCurrentViewId, setCurrentViewId] = useQueryState(
    'view',
    parseAsString
  )
  const { report, updateReport } = useReport()
  console.log({ report })
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

  function updateView(
    cb: (draft: WritableDraft<SpecificViewConfig<HookVT>>) => void
  ) {
    if (specifiedTypeCurrentView) {
      updateReport((draft) =>
        produce(draft.displayOptions.views[specifiedTypeCurrentView.id], cb)
      )
    }
  }
}
