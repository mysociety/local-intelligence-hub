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
    return (
        <div
            className={`
                [&[data-rfd-droppable-id~="filterable-grid-cells"]]:bg-red-100
                [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:lg:grid-cols-4
                [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:sm:grid-cols-2
                [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:grid-cols-1
                [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:gap-[25px]
                [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:grid-rows-[var(--gridTemplateRows)]
            `}
            style={{
                // @ts-ignore
                "--gridTemplateRows": rows
            }}
        >
            <DropZone zone={`filterable-grid-cells`} />
        </div>
    );
};