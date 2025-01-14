import { ComponentConfig } from '@measured/puck'

export type GridRowProps = {
  columns: string
}
export const GridRow: ComponentConfig<GridRowProps> = {
  label: 'GridRow',
  fields: {
    columns: {
      type: 'select',
      options: [
        { label: '4 Columns', value: '4-columns' },
        { label: '3 Columns', value: '3-columns' },
        { label: '2 Columns', value: '2-columns' },
      ],
    },
  },
  defaultProps: {
    columns: '4-columns',
  },
  render: ({ columns, puck: { renderDropZone } }) => {
    const columnCount =
      columns === '4-columns' ? 4 : columns === '3-columns' ? 3 : 2

    return (
      <div
        className={`grid gap-[25px] mb-[25px] ${
          columnCount === 4
            ? 'lg:grid-cols-4 sm:grid-cols-2'
            : columnCount === 3
              ? 'lg:grid-cols-3 sm:grid-cols-2'
              : 'lg:grid-cols-2 sm:grid-cols-2'
        }`}
        style={{ gridAutoRows: 'minmax(100px, auto)' }}
      >
        {Array.from({ length: columnCount }).map((_, idx) => (
          <div key={idx} className="flex flex-col gap-[25px] h-full">
            {renderDropZone({ zone: `Col-${idx + 1}` })}
          </div>
        ))}
      </div>
    )
  },
}
