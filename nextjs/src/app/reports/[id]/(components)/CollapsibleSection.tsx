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
  titleProps?: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  >
}

const collapsibleSectionsAtom = atom<{ [key: string]: boolean }>({})

const CollapsibleSection: React.FC<Props> = ({
  children,
  id,
  title,
  actions,
  titleProps = {},
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
        <div className="flex flex-row gap-2 items-start my-3 cursor-pointer">
          <h3
            className="text-white font-medium mr-2 gap-2 flex flex-row shrink-0"
            {...titleProps}
          >
            {title}
          </h3>
          <CollapsibleTrigger className="w-full grow flex items-start flex-row justify-start">
            <TriangleDownIcon
              className={clsx(
                'mt-1 h-4 w-4 text-white',
                thisSectionOpen ? '' : 'rotate-180'
              )}
            />
          </CollapsibleTrigger>
          <div className="ml-auto">{actions}</div>
        </div>

        <CollapsibleContent className="CollapsibleContent">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export default CollapsibleSection
