import { Button } from '@/components/ui/button'
import { ExplorerState, StarredState, useExplorerState } from '@/lib/map'
import { MapPinIcon, X } from 'lucide-react'
import useStarredItems from '../useStarredItems'

import { dataTypeIcons } from '@/lib/data'
import { StarFilledIcon } from '@radix-ui/react-icons'
import { useReport } from './ReportProvider'
export default function ReportStarredItems() {
  return (
    <div className="flex flex-col gap-2 text-white">
      <span className="text-md font-medium mt-2 mb-3">Starred</span>
      <StarredItemsList />
    </div>
  )
}

export function StarredItemsList() {
  const { report, updateReport } = useReport()
  const starredItems = report?.displayOptions?.starred || []

  const [explorerState, setExplorerState] = useExplorerState()
  const { removeStarredItem } = useStarredItems()

  function handleStarredItemClick(item: ExplorerState) {
    const entity = item.entity
    const id = item.id

    // this is reloading the page for some reason so i'm using the setExplorerState hook
    // exploreArea(id)
    setExplorerState({
      entity,
      id,
      showExplorer: true,
    })
  }
  return (
    <div>
      {starredItems?.length === 0 ? (
        <div className="text-gray-400 ">No starred items yet</div>
      ) : (
        starredItems?.map((item) => (
          <div
            key={item.id}
            className="flex cursor-pointer hover:bg-meepGray-500 items-center justify-between p-2 rounded-md text-sm group"
            onClick={() => handleStarredItemClick(item)}
          >
            <div className="flex items-center gap-2 ">
              <StarredItemIcon starredItem={item} />
              <span>{item.name}</span>
            </div>
            <Button
              onClick={() => removeStarredItem(item.id)}
              variant="ghost"
              className="text-meepGray-200 p-0 h-3 opacity-40"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))
      )}
    </div>
  )
}

function StarredItemIcon({ starredItem }: { starredItem: StarredState }) {
  const Icon = starredItem.icon
    ? dataTypeIcons[starredItem.icon].icon
    : starredItem.entity === 'area'
      ? MapPinIcon
      : StarFilledIcon
  return <Icon className="w-4 h-4 text-meepGray-400 fill-meepGray-400" /> //
}
