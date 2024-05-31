/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ComponentConfig } from "@measured/puck";
import HubResponsivity from "../../template/HubReponsivity";

export type SectionHeaderProps = {
    title: string;
    description: string;

};

export const SectionHeader: ComponentConfig<SectionHeaderProps> = {
    fields: {
        title: {
            type: "text",
        },
        description: {
            type: "textarea",
        },
    },
    defaultProps: {
        title: "Heading",
        description: "Dignissimos et eos fugiat. Facere aliquam corrupti est voluptatem veritatis amet id. Nam repudiandae accusamus illum voluptatibus similique consequuntur. Impedit ut rerum quae. Dolore qui mollitia occaecati soluta numquam. Non corrupti mollitia libero aut atque quibusdam tenetur."
    },
    render: ({ title, description }) => {
        return (
            <HubResponsivity>

                <div className="col-span-2 aspect-[2/1] rounded-[20px]  p-5 border border-jungle-green-200 flex flex-col gap-2 justify-end transition-all">
                    <h2 className="lg:text-hub4xl text-hub3xl">{title}</h2>
                    <p className="text-xl">{description}</p>
                </div>
            </HubResponsivity>
        );
    },
};
