import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { TriangleDownIcon } from '@radix-ui/react-icons'
import clsx from 'clsx'
import { atom, useAtom } from 'jotai'
import React from 'react'

interface Props {
  id: string
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
}

const collapsibleSectionsAtom = atom<{ [key: string]: boolean }>({})

const CollapsibleSection: React.FC<Props> = ({
  children,
  id,
  title,
  actions,
}) => {
  const [sections, setSections] = useAtom(collapsibleSectionsAtom)
  const thisSectionOpen = sections[id] === undefined ? true : !!sections[id]

  const toggleSection = () => {
    setSections((prev) => {
      const newValue = prev[id] === undefined ? false : !prev[id]
      return {
        ...prev,
        [id]: newValue,
      }
    })
  }

  return (
    <Collapsible
      key={id}
      defaultOpen
      className="mb-2"
      onOpenChange={toggleSection}
      open={!!thisSectionOpen}
    >
      <div>
        <div className="flex flex-row gap-2 items-end my-3 cursor-pointer">
          <CollapsibleTrigger asChild className="mr-auto">
            <h3 className="text-white font-medium mr-2 gap-2 flex flex-row">
              {title}
              <TriangleDownIcon
                className={clsx(
                  'mt-1 h-4 w-4 text-white mr-auto',
                  thisSectionOpen ? '' : 'rotate-180'
                )}
              />
            </h3>
          </CollapsibleTrigger>
          {actions}
        </div>

        <CollapsibleContent className="CollapsibleContent">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export default CollapsibleSection
