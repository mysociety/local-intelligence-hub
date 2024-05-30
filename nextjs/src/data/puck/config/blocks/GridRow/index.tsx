import React from "react";

import { ComponentConfig } from "@measured/puck";

import { DropZone } from "@measured/puck";


export type GridRowProps = {
    columns: string;

};

export const GridRow: ComponentConfig<GridRowProps> = {
    label: "GridRow",
    fields: {
        columns: {
            type: "select",
            options: [
                { label: "4 Columns", value: "4-columns" },
                { label: "2 Columns", value: "2-columns" },

            ],
        },
    },
    defaultProps: {
        columns: "4-columns",

    },
    render: ({ columns }) => {
        return (
            <>
                {columns === "4-columns" && (
                    <div className="grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-[25px] mb-[25px]"  >
                        <DropZone zone="Col-1" />
                        <DropZone zone="Col-2" />
                        <DropZone zone="Col-3" />
                        <DropZone zone="Col-4" />
                    </div>
                )}
                {columns === "2-columns" && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px', marginBottom: '25px' }} >
                        <DropZone zone="Col-1" />
                        <DropZone zone="Col-2" />
                    </div>
                )}
            </>

        )
    },
};
