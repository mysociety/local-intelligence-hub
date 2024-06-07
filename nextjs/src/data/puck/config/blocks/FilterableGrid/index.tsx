import React, { useMemo, useState } from "react";

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

const itemTypes = [
    { label: "Resource", value: "resource" },
    { label: "Action", value: "action" },
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
            props: {
                categories: data.props.categories?.map((category: any) => ({
                    ...category,
                    urlSlug: !!category.title ? slugify(category.title) : category.urlSlug
                })),
                ...data
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
    const [tags, setTags] = useQueryState("tag", parseAsArrayOf(parseAsStringEnum(itemTypes.map(t => t.value))))
    const [category, setCategory] = useQueryState("category", parseAsStringEnum(categories.map(c => c.urlSlug)))
    // Listen for router changes, then produce new items
    const filteredItems = useMemo(() => {
        if (!items) return []
        if (!tags && !category) return items
        return items.filter(item =>
            (!tags?.length || tags?.includes(item.type)) &&
            (!category || item.categories.some(c => c.category === category))
        )
    }, [items, tags, category])
    const categoryData = categories.find(c => c.urlSlug === category)
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
            <section id="get-involved">
                <header>
                    <h2>Ways to get involved</h2>
                    <p>Here{"'"}s how you can help centre people, climate and nature this election.</p>
                </header>
                <div className='grid sm:grid-cols-2 lg:grid-cols-3'>
                    <PostcodeSearch />
                    {categories.map((category, index) => (
                        <div key={index} className='overflow-clip rounded-[20px] hover:shadow-hover transition-all' onClick={() => {
                            setCategory(category.urlSlug)
                        }}>
                            <div className="p-5 bg-jungle-green-50 h-full relative gap-2 flex flex-col justify-end">
                                <div className="z-10 flex flex-col gap-2">
                                    <Image src={tccHeart} width={30} alt="arrow" />
                                    <h2 className="lg:text-hub4xl text-hub3xl tracking-tight">{category.title}</h2>
                                    <PuckText text={category.description} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            {/* Grid */}
            <section>
                {(!categoryData) ? (
                    <header>
                        <h2>Latest from across the campaign</h2>
                        <p>Explore our wall of activity from the hub</p>
                    </header>
                ) : (
                    <header>
                        <Link href="/#get-involved">
                            &larr; Back to Ways To Get Involved
                        </Link>
                        <h2>{categoryData.title}</h2>
                        <PuckText text={categoryData.description} />
                    </header>
                )}
                <div className='flex flex-row gap-4'>
                    <div>Filter</div>
                    {itemTypes.map((itemType, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                // Toggle tag based on click
                                setTags(t => t?.includes(itemType.value) ? t.filter(tag => tag !== itemType.value) : [...(t || []), itemType.value])
                            }}
                            className={tags?.includes(itemType.value) ? 'bg-jungle-green-600 text-white' : 'bg-jungle-green-100 text-jungle-green-600'}
                        >
                            {itemType.label}
                        </button>
                    ))}
                </div>
                <div className='grid sm:grid-cols-2 lg:grid-cols-4'>
                    {filteredItems
                        // ?.sort((a, b) => compareAsc(a.timestamp, b.timestamp))
                        .map((item, index) => (
                        <RenderCard key={index} {...item} />
                    ))}
                </div>
            </section>
        </div>
    );
};

function PostcodeSearch () {
    const router = useRouter()
    const [postcode, setPostcode] = useState("")
    return (
        <article className='overflow-clip rounded-[20px] hover:shadow-hover transition-all'>
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
                                placeholder="Enter your postcode"
                                autoComplete="postal-code"
                                className=" border-hub-foreground p-8 focus-visible:ring-0 text-3xl placeholder:text-hub4xl pl-10 placeholder:text-jungle-green-600 bg-jungle-green-100 border-0"
                                value={postcode}
                                onChange={e => setPostcode(e.target.value)}
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