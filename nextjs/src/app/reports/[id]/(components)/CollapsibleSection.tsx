import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { TriangleDownIcon } from '@radix-ui/react-icons'
import clsx from 'clsx'
import { atom, useAtom } from 'jotai'
import React from 'react'
import { twMerge } from 'tailwind-merge'

interface Props {
  id: string
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
  titleProps?: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  >
  headerProps?: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >
}

const collapsibleSectionsAtom = atom<{ [key: string]: boolean }>({})

const CollapsibleSection: React.FC<Props> = ({
  children,
  id,
  title,
  actions,
  className,
  headerProps = {},
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
      className={twMerge('mb-2', className)}
      onOpenChange={toggleSection}
      open={!!thisSectionOpen}
    >
      <div>
        <header
          {...headerProps}
          className={twMerge(
            'flex flex-row gap-2 items-start my-3 cursor-pointer',
            headerProps?.className
          )}
        >
          <h3
            className="text-white [[data-state=closed]_&]:text-meepGray-400 font-medium mr-2 gap-2 flex flex-row shrink-0"
            {...titleProps}
          >
            {title}
          </h3>
          <div className="flex flex-row gap-2 items-start">
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
        </header>

        <CollapsibleContent className="CollapsibleContent">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export default CollapsibleSection
