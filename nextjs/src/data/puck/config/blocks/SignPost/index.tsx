import React from "react";

import { ComponentConfig } from "@measured/puck";
import Image from "next/image"
import CirclePattern from "../../../../../../public/hub/main-circle-pattern.svg"


import ArrowTopRight from "../../../../../../public/hub/arrow-top-right.svg";
import ukMap from "../../../../../../public/hub/uk-map.svg";

import tccHeart from "../../../../../../public/hub/tcc-heart.svg";

export type SignPostProps = {
    resourcesSubtitle: string
    actionsSubtitle: string
    mapSubtitle: string
};

export const SignPost: ComponentConfig<SignPostProps> = {
    label: "SignPost",
    fields: {
        resourcesSubtitle: {
            type: "text",
        },
        actionsSubtitle: {
            type: "text",
        },
        mapSubtitle: {
            type: "text",
        },
    },
    defaultProps: {
        resourcesSubtitle: "Files, links and More",
        actionsSubtitle: "Things you can do today",
        mapSubtitle: "See what’s happening across the UK",
    },


    render: ({resourcesSubtitle, actionsSubtitle, mapSubtitle}) => {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '25px' }} >

                <div className="col-span-1 w-full h-full aspect-square overflow-clip rounded-[20px] hover:shadow-hover transition-all">
                    <div className="p-5 bg-white h-full relative gap-2 flex flex-col justify-end ">
                        <Image src={ArrowTopRight} width={30} alt="arrow" />
                        <h2 className="text-hubH3 tracking-tight">Resources</h2>
                        <p className="text-hubH5 text-jungle-green-700">{actionsSubtitle}</p>
                        <div className="absolute right-0 top-0 ">
                            <Image
                                className="h-full"
                                src={tccHeart}
                                width={10}
                                alt="decorative"
                                layout="responsive"
                            />
                        </div>
                    </div>
                </div>
                <div className=" col-span-1  w-full h-full aspect-square overflow-clip rounded-[20px] hover:shadow-hover transition-all">
                    <div className="p-5 bg-jungle-green-600 text-white h-full relative gap-2 flex flex-col justify-end">
                        <Image src={ArrowTopRight} width={30} alt="arrow" />
                        <h2 className="text-hubH3 tracking-tight">Actions</h2>
                        <p className="text-hubH5 text-jungle-green-100">{resourcesSubtitle}</p>

                        <Image
                            className="object-cover rounded-[40px] absolute top-0 left-0 "
                            src={CirclePattern}
                            width={500}
                            alt="hero image"
                            layout="responsive"
                        />
                    </div>
                </div>
                <div className=" col-span-2 w-full h-full overflow-clip rounded-[20px] hover:shadow-hover transition-all">
                    <div className="p-5 bg-jungle-green-50 h-full relative gap-2 flex flex-col justify-end">
                        <Image src={ArrowTopRight} width={30} alt="arrow" />
                        <h2 className="text-hubH3 tracking-tight">Event Map</h2>
                        <p className="text-hubH5 text-jungle-green-700">{mapSubtitle}</p>
                        <div className="absolute right-10 top-0 ">
                            <Image
                                className="h-full"
                                src={ukMap}
                                width={10}
                                alt="map of the uk"
                                layout="responsive"
                            />
                        </div>
                    </div>
                </div>

            </div>
        )
    },
};
