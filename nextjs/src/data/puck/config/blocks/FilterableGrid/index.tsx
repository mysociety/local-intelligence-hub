import React from "react";

import { ComponentConfig } from "@measured/puck";

import { DropZone } from "@measured/puck";


export type FilterableGridProps = {
    rows: number;
};

export const FilterableGrid: ComponentConfig<FilterableGridProps> = {
    label: "FilterableGrid",
    fields: {
        rows: {
            type: "number",
            min: 1,
        },
    },
    defaultProps: {
        rows: 6
    },
    render: (props) => {
        return <FilterableGridRenderer {...props} />
    },
};

const FilterableGridRenderer = ({ rows }: FilterableGridProps) => {
    const calculatedRows = 4 * rows
    return (
        <div
            className={`grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-[25px] mb-[25px]`}
            style={{
                gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
        >
            {Array.from({ length: calculatedRows }, (_, i) => (
                <DropZone key={i} zone={`filterable-grid-cell-${i + 1}`} />
            ))}
        </div>
    );
};