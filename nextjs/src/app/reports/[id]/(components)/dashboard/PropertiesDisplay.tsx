import clsx from 'clsx'
import { Eye, EyeOff } from 'lucide-react'
import React from 'react'
import { twMerge } from 'tailwind-merge'
import { useReport } from '../ReportProvider'
import { formatKey, isEmptyValue } from './utils'

export function PropertiesDisplay({
  data,
  editing,
  setEditing,
}: {
  data: any
  editing?: boolean
  setEditing?: (editing: boolean) => void
  config?: {
    columns?: string[]
  }
}) {
  const indentLevel = 0

  if (data === null || data === undefined) {
    return <div className="text-meepGray-400 py-2">No data available</div>
  }

  return (
    <div className="flex flex-col gap-2">
      <FormatValue
        data={data}
        indentLevel={indentLevel}
        editing={editing || false}
        setEditing={setEditing}
      />
    </div>
  )
}

function FormatValue({
  data,
  indentLevel = 0,
  editing,
  setEditing,
}: {
  data: any
  indentLevel?: number
  editing: boolean
  setEditing?: (editing: boolean) => void
}) {
  const { report, addVisibleProperty, removeVisibleProperty } = useReport()
  const visibleProperties = report?.displayOptions?.visibleProperties || []

  if (data === null || data === undefined) {
    // Nothing
    return null
  } else if (typeof data === 'string' || typeof data === 'number') {
    // Raw value
    return <span>{data}</span>
  } else if (Array.isArray(data)) {
    // Array; indented

    return (
      <ul style={{ marginLeft: `${indentLevel * 1}rem` }}>
        {data.filter(isEmptyValue).map((item, index) => (
          <li key={index}>
            <FormatValue
              data={item}
              editing={editing}
              setEditing={setEditing}
            />
          </li>
        ))}
      </ul>
    )
  } else if (
    data !== null &&
    typeof data === 'object' &&
    data.constructor === Object
  ) {
    // Nested property list; indented
    return (
      <div
        className="space-y-3"
        style={{ marginLeft: `${indentLevel * 1}rem` }}
      >
        {Object.entries(data || {})
          .filter(([key, value]) => {
            return (
              !isEmptyValue(value) &&
              // remove stuff added by Apollo
              key !== '__typename'
            )
          })
          .map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between gap-2"
              onClick={() => {
                handlePropertyClick(
                  key,
                  visibleProperties,
                  addVisibleProperty,
                  removeVisibleProperty
                )
              }}
            >
              <KeyContainer
                title={key}
                titleClassName={isObject(value) ? 'mb-3' : ''}
                className={clsx(
                  visibleProperties.length === 0 ||
                    visibleProperties.some((prop) => prop.id === key)
                    ? 'opacity-100'
                    : 'opacity-50'
                )}
                children={
                  <FormatValue
                    data={value}
                    indentLevel={indentLevel + 1}
                    editing={editing}
                  />
                }
              />
              {editing && (
                <div className="w-4 h-4 text-meepGray-400 cursor-pointer">
                  {visibleProperties.some((prop) => prop.id === key) ? (
                    <EyeOff className="w-4 h-4 text-white hover:text-red-300" />
                  ) : (
                    <Eye className="w-4 h-4 hover:text-green-300" />
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    )
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>
}

function isObject(data: any): data is Record<string, any> {
  return (
    data !== null && typeof data === 'object' && data.constructor === Object
  )
}

function handlePropertyClick(
  propertyId: string,
  visibleProperties: any[],
  addVisibleProperty: (property: {
    id: string
    entity: 'area' | 'record'
    showExplorer: boolean
    visibleProperties?: string[]
  }) => void,
  removeVisibleProperty: (propertyId: string) => void
) {
  if (visibleProperties.some((prop) => prop.id === propertyId)) {
    removeVisibleProperty(propertyId)
  } else {
    addVisibleProperty({
      id: propertyId,
      entity: 'record',
      showExplorer: true,
      visibleProperties: [propertyId],
    })
  }
}

function KeyContainer({
  title,
  titleClassName,
  children,
  className,
}: {
  title: React.ReactNode
  titleClassName?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={twMerge('flex flex-col', className)}>
      <header
        className={twMerge(
          'text-meepGray-200 uppercase text-xs',
          titleClassName
        )}
      >
        {typeof title === 'string' ? formatKey(title) : title}
      </header>
      <div className="text-white">{children}</div>
    </section>
  )
}
