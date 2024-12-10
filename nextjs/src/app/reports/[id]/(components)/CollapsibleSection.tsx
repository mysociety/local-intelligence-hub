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
}

const collapsibleSectionsAtom = atom<{ [key: string]: boolean }>({})

const CollapsibleSection: React.FC<Props> = ({ children, id, title }) => {
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
      <CollapsibleTrigger asChild>
        <div className="flex flex-row gap-2 items-center my-3 cursor-pointer">
          <TriangleDownIcon
            className={clsx(
              'h-4 w-4 text-white transition[-rotate-180] duration-700',
              thisSectionOpen ? '' : 'rotate-180'
            )}
          />

          <h3 className="text-white font-medium">{title}</h3>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="CollapsibleContent">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default CollapsibleSection
