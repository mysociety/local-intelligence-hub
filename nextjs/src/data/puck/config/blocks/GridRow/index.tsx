import React from "react";

import { ComponentConfig } from "@measured/puck";

import { DropZone } from "@measured/puck";


export type GridRowProps = {
    size: string;
};

export const GridRow: ComponentConfig<GridRowProps> = {
    label: "GridRow",


    render: () => {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '25px' }} >
                <DropZone zone="Col-1" />
                <DropZone zone="Col-2" />
                <DropZone zone="Col-3" />
                <DropZone zone="Col-4" />
            </div>
        )
    },
};
