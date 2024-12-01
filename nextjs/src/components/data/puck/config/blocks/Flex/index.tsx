import { Section } from '@/components/data/puck/config/components/Section'
import { ComponentConfig } from '@measured/puck'

export type FlexProps = {
  items: { minItemWidth?: number }[]
  minItemWidth: number
}

export const Flex: ComponentConfig<FlexProps> = {
  fields: {
    items: {
      type: 'array',
      arrayFields: {
        minItemWidth: {
          label: 'Minimum Item Width',
          type: 'number',
          min: 0,
        },
      },
      getItemSummary: (_, id) => `Item ${(id || 0) + 1}`,
    },
    minItemWidth: {
      label: 'Minimum Item Width',
      type: 'number',
      min: 0,
    },
  },
  defaultProps: {
    items: [{}, {}],
    minItemWidth: 356,
  },
  render: ({ items, minItemWidth, puck: { renderDropZone } }) => {
    return (
      <Section>
        <div>
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{ minWidth: item.minItemWidth || minItemWidth }}
            >
              {renderDropZone({ zone: `item-${idx}` })}
            </div>
          ))}
        </div>
      </Section>
    )
  },
}
