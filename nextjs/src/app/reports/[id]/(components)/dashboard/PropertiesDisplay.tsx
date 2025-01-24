import React from 'react'
import { twMerge } from 'tailwind-merge'
import { formatKey, isEmptyValue } from './utils'

export function PropertiesDisplay({
  data,
}: {
  data: any
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
      <FormatValue data={data} indentLevel={indentLevel} />
    </div>
  )
}

function FormatValue({
  data,
  indentLevel = 0,
}: {
  data: any
  indentLevel?: number
}) {
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
            <FormatValue data={item} />
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
            <KeyContainer
              key={key}
              title={key}
              titleClassName={isObject(value) ? 'mb-3' : ''}
              children={
                <FormatValue data={value} indentLevel={indentLevel + 1} />
              }
            />
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

function KeyContainer({
  title,
  titleClassName,
  children,
}: {
  title: React.ReactNode
  titleClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col">
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
