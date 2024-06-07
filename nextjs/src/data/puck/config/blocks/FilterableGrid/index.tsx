import React, { useEffect, useMemo, useState } from "react";

import { ComponentConfig } from "@measured/puck";
import { DropZone } from "@measured/puck";
import Link from "next/link";
import Image from "next/image";
import CirclePattern from "../../../../../../public/hub/main-circle-pattern.svg"
import ArrowTopRight from "../../../../../../public/hub/arrow-top-right.svg";
import ukMap from "../../../../../../public/hub/uk-map.svg";
import tccHeart from "../../../../../../public/hub/tcc-heart.svg";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useParams, useRouter } from "next/navigation";
import { compareAsc } from "date-fns";
import { RenderCard } from "../Card";
import slugify from 'slug'
import { useQueryState, parseAsArrayOf, parseAsStringEnum } from 'nuqs'
import { PuckText } from "../../components/PuckText";
import { twMerge } from "tailwind-merge";

export const itemTypes = [
    { label: "Resource", value: "resource" },
    { label: "Action", value: "action" },
    { label: "Event", value: "event" },
] as const

// TODO:
export type FilterableGridProps = {
    categories: Array<{
        title: string;
        urlSlug: string;
        description: string;
    }>,
    items: Array<{
        categories: Array<{
            category: string;
        }>,
        type: typeof itemTypes[number]["value"];
        behaviour: string;
        title: string;
        description: string;
        dialogDescription: string;
        link: string;
        linkLabel: string;
        timestamp: number;
    }>
}

export const FilterableGrid: ComponentConfig<FilterableGridProps> = {
    label: "FilterableGrid",
    resolveFields: (data, puck) => {
        return {       
            categories: {
                type: "array",
                arrayFields: {
                    title: {
                        type: "text",
                    },
                    urlSlug: {
                        type: "text",
                    },
                    description: {
                        type: "textarea",
                    },
                },
                getItemSummary(item, index) {
                    return item.title || `Item ${index}`;
                }
            },
            items: {
                type: "array",
                arrayFields: {
                    categories: {
                        type: "array",
                        arrayFields: {
                            category: {
                                type: "select",
                                options: data.props.categories?.map((category: any) => ({
                                    label: category.title,
                                    value: category.urlSlug,
                                }))
                            },
                        },
                        getItemSummary(item, index) {
                            return `Filed under ${item.category}`;
                        }
                    },
                    type: {
                        type: "select",
                        options: itemTypes,
                    },
                    behaviour: {
                        type: "select",
                        options: [
                            { label: "Dialog", value: "dialog" },
                            { label: "No action", value: "nothing" },
                        ],
                    },
                    title: {
                        type: "text"
                    },
                    description: {
                        type: "textarea",
                    },
                    dialogDescription: {
                        // @ts-ignore
                        // visible: data.props.behaviour === "dialog",
                        type: "textarea",
                    },
                    link: {
                        // @ts-ignore
                        // visible: data.props.behaviour !== "nothing",
                        type: "text",
                    },
                    linkLabel: {
                        // @ts-ignore
                        // visible: data.props.behaviour === "dialog",
                        type: "text",
                    },
                    timestamp: {
                        type: "number"
                    }
                },
                defaultItemProps: {
                    categories: [],
                    type: "resource",
                    behaviour: "dialog",
                    title: "",
                    description: "",
                    dialogDescription: "",
                    link: "",
                    linkLabel: "",
                    timestamp: Date.now(),
                },
                getItemSummary(item, index) {
                    return item.title || `Item ${index}`;
                }
            },
        }
    },
    resolveData: (data, puck) => {
        return {
            ...data,
            props: {
                ...data.props,
                categories: data.props.categories?.map((category: any) => ({
                    ...category,
                    urlSlug: !!category?.urlSlug ? slugify(category.urlSlug) : category?.urlSlug
                }))
            }
        }
    },
    defaultProps: {
        categories: [],
        items: []
    },
    render: (props) => {
        return <FilterableGridRenderer {...props} />
    },
};

const FilterableGridRenderer = ({ categories, items }: FilterableGridProps) => {
    const router = useRouter()
    const [tag, setTag] = useQueryState("tag", parseAsStringEnum(itemTypes.map(t => t.value)))
    const [category, setCategory] = useQueryState("category", parseAsStringEnum(categories.map(c => c.urlSlug)))

    // Listen for router changes, then produce new items
    const filteredItems = useMemo(() => {
        if (!items) return []
        if (!tag && !category) return items
        return items?.filter(item =>
            (!tag || tag === item.type) &&
            (!category || item.categories?.some(c => c.category === category))
        )
    }, [items, tag, category])
    const categoryData = categories?.find(c => c.urlSlug === category)

    // Scroll items into full
    useEffect(() => {
        if (category) {
            document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" })
        }
    }, [category])

    return (
        // <div
        //     className={`
        //         [&[data-rfd-droppable-id~="filterable-grid-cells"]]:bg-red-100
        //         [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:lg:grid-cols-4
        //         [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:sm:grid-cols-2
        //         [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:grid-cols-1
        //         [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:gap-[25px]
        //         [&[data-rfd-droppable-id~="FilterableGrid-321fac77-691b-49d4-8c90-2aaf16492217:filterable-grid-cells"]]:grid-rows-[var(--gridTemplateRows)]
        //     `}
        //     style={{
        //         // @ts-ignore
        //         "--gridTemplateRows": rows
        //     }}
        // >
        //     <DropZone zone={`filterable-grid-cells`} />
        // </div>
        <div>
            {/* Categories */}
            {!categoryData && (
                <section id="get-involved">
                    <header className='space-y-2 pt-16 mb-10 md:pt-32 md:mb-14'>
                        <h2 className='text-hub4xl md:text-hub6xl'>Ways to get involved</h2>
                        <p className='text-jungle-green-neutral text-hub2xl'>Here{"'"}s how you can help centre people, climate and nature this election.</p>
                    </header>
                    <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4 xl:gap-5'>
                        <PostcodeSearch className='h-full' />
                        <div className='lg:col-span-2 grid lg:grid-cols-2 gap-2 md:gap-3 lg:gap-4 xl:gap-5'>
                            {categories.map((category, index) => (
                                <div key={index} className='rounded-[20px] hover:bg-jungle-green-100 transition-all cursor-pointer p-4 space-y-2' onClick={() => {
                                    setCategory(category.urlSlug)
                                    document.getElementById("latest")?.scrollIntoView({ behavior: "smooth" })
                                }}>
                                    <Image src={tccHeart} width={20} height={20} alt="arrow" />
                                    <h2 className="text-jungle-green-600 text-hub3xl tracking-tight">{category.title}</h2>
                                    <PuckText className='text-jungle-green-neutral' text={category.description} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            {/* Grid */}
            <section id="latest">
                {(!categoryData) ? (
                    <header className='space-y-2 pt-16 mb-10 md:pt-32 md:mb-14'>
                        <h2 className='text-hub4xl md:text-hub6xl'>Latest from across the campaign</h2>
                        <p className='text-jungle-green-neutral text-hub2xl'>
                            Explore our wall of activity from the hub
                        </p>
                    </header>
                ) : (
                    <header className='space-y-2 pt-16 mb-10 md:pt-32 md:mb-14'>
                        <div onClick={() => {
                            setCategory(null)
                            setTimeout(() => {
                                document.getElementById("get-involved")?.scrollIntoView({ behavior: "smooth" })
                            }, 500)
                        }}>
                            &larr; Back to Ways To Get Involved
                        </div>
                        <h2 className='text-hub4xl md:text-hub6xl'>{categoryData.title}</h2>
                        <PuckText className='text-jungle-green-neutral text-hub2xl' text={categoryData.description} />
                    </header>
                )}
                <div className='flex flex-row gap-4 mb-8 items-center'>
                    <div className='text-meepGray-400 uppercase'>Filter Hub Content:</div>
                    <button
                        onClick={() => {
                            // Toggle tag based on click
                            setTag(t => null)
                        }}
                        className={twMerge(
                            "rounded-full px-3 py-1 cursor-pointer uppercase",
                            !tag ? 'bg-jungle-green-600 text-white' : 'bg-jungle-green-100 text-jungle-green-600'
                        )}
                    >
                        all
                    </button>
                    {itemTypes.map((itemType, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                // Toggle tag based on click
                                setTag(t => t === itemType.value ? null : t)
                            }}
                            className={twMerge(
                                "rounded-full px-3 py-1 cursor-pointer uppercase",
                                tag === itemType.value ? 'bg-jungle-green-600 text-white' : 'bg-jungle-green-100 text-jungle-green-600'
                            )}
                        >
                            {itemType.label}
                        </button>
                    ))}
                </div>
                <div className='border-b border-meepGray-200 my-4' />
                <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 lg:gap-4 xl:gap-5 mb-8 md:mb-16 lg:mb-20'>
                    {filteredItems
                        // TODO:
                        // ?.sort((a, b) => compareAsc(a.timestamp, b.timestamp))
                        .map((item, index) => (
                        <RenderCard key={index} {...item} />
                    ))}
                </div>
            </section>
        </div>
    );
};

function PostcodeSearch ({ className }: { className?: string }) {
    const router = useRouter()
    const [postcode, setPostcode] = useState("")
    return (
        <article className={twMerge('overflow-clip rounded-[20px] hover:shadow-hover transition-all', className)}>
            <div className="p-5 bg-jungle-green-50 h-full relative gap-2 flex flex-col justify-end">
                <div className="z-10 flex flex-col gap-2">
                    <Image src={ArrowTopRight} width={30} alt="arrow" />
                    <h2 className="lg:text-hub4xl text-hub3xl tracking-tight">Near me</h2>
                    <p className="text-hubH5 ">Find out what’s happening in your local constituency</p>
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        router.push(`/map/postcode/${postcode}`);
                    }}>
                        <div className=" flex items-center relative text-jungle-green-600">
                            <Search className="absolute ml-2" />
                            <Input
                                placeholder="postcode"
                                autoComplete="postal-code"
                                className=" border-hub-foreground p-8 focus-visible:ring-0 text-2xl placeholder:text-hub4xl pl-10 placeholder:text-jungle-green-600 bg-jungle-green-100 border-0"
                                value={postcode}
                                onChange={e => setPostcode(e.target.value.toUpperCase().trim().replaceAll(" ", ""))}
                            />
                            <button
                                className='bg-jungle-green-600 text-white text-lg font-bold rounded-md p-4 ml-2'
                                disabled={!postcode}
                            >
                                Search
                            </button>
                        </div>
                    </form>
                    <p className="text-jungle-green-600 text-sm">
                        Powered using <Link href="https://prototype.mapped.commonknowledge.coop" className="underline">Mapped</Link> by Common Knowledge
                    </p>
                </div>
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
        </article>
    )
}