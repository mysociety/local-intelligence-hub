import React, { useEffect, useMemo, useState } from "react";

import { ComponentConfig, Data } from "@measured/puck";
import { FilterableGridProps, FilterableGridRenderer } from "../FilterableGrid";
import { gql, useQuery } from "@apollo/client";
import { LoadingIcon } from "@/components/ui/loadingIcon";
import { GetHubHomepageJsonQuery, GetHubHomepageJsonQueryVariables } from "@/__generated__/graphql";

// TODO:
export type HomepageItemsAliasProps = {}

export const HomepageItemsAlias: ComponentConfig<HomepageItemsAliasProps> = {
    label: "Homepage Items Alias",
    fields: {
        text: {
            type: "text",
        }
    },
    render: (props) => {
        return <HomepageItemsAliasRenderer />
    },
};

const HomepageItemsAliasRenderer = () => {
    const data = useQuery<GetHubHomepageJsonQuery, GetHubHomepageJsonQueryVariables>(GET_HUB_HOMEPAGE_JSON, {
        variables: {
            hostname: typeof window !== 'undefined' ? window.location.hostname : ''
        },
        skip: typeof window === 'undefined'
    })

    const puckData = data.data?.hubPageByPath?.puckJsonContent as Data<FilterableGridProps>
    const gridProps = puckData?.content.find((item) => (
        // @ts-ignore — Puck types aren't good here.
        item.type === "FilterableGrid"
    ))?.props

    if (!data) return <LoadingIcon />

    if (!gridProps) return <div>Something went wrong.</div>

    return (
        <FilterableGridRenderer {...gridProps} showAll={false} />
    )
}

const GET_HUB_HOMEPAGE_JSON = gql`
    query GetHubHomepageJson($hostname: String!) {
        hubPageByPath(hostname: $hostname) {
            puckJsonContent
        }
    }
`