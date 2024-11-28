import { Config, ComponentConfig } from "@measured/puck";
import Root, { RootProps } from "./root";
import { ButtonGroup, ButtonGroupProps } from "./blocks/ButtonGroup";
import { Card, CardProps } from "./blocks/Card";
import { Columns, ColumnsProps } from "./blocks/Columns";
import { Hero, HeroProps } from "./blocks/Hero";
import { Heading, HeadingProps } from "./blocks/Heading";
import { Flex, FlexProps } from "./blocks/Flex";
import { Logos, LogosProps } from "./blocks/Logos";
import { Stats, StatsProps } from "./blocks/Stats";
import { Text, TextProps } from "./blocks/Text";
import { EventCard, EventCardProps } from "./blocks/EventCard";
import { VerticalSpace, VerticalSpaceProps } from "./blocks/VerticalSpace";
import { GridRow, GridRowProps } from "./blocks/GridRow";
import { SignPost, SignPostProps } from "./blocks/SignPost";
import { SectionHeader, SectionHeaderProps } from "./blocks/SectionHeader/SectionHeader";
import { FilterableGrid, FilterableGridProps } from "./blocks/FilterableGrid";
import { EventList, EventListProps } from "./blocks/EventList";
import { Image, ImageProps } from "./blocks/Image";
import { HomepageItemsAlias } from "./blocks/HomepageItemsAlias";
import { About } from "./blocks/About";
import { HTMLEmbed, HTMLEmbedProps } from "./blocks/HTMLEmbed";
import { RichText, RichTextProps } from "./blocks/RichText";
import { Iframe, IframeProps } from "./blocks/Iframe";
import { MemberForm, MemberFormProps } from "./blocks/MemberForm";

export type Props = {
  EventList: EventListProps;
  ButtonGroup: ButtonGroupProps;
  Card: CardProps;
  Columns: ColumnsProps;
  Hero: HeroProps;
  Heading: HeadingProps;
  Flex: FlexProps;
  Logos: LogosProps;
  Stats: StatsProps;
  Text: TextProps;
  Image: ImageProps;
  VerticalSpace: VerticalSpaceProps;
  EventCard: EventCardProps;
  GridRow: GridRowProps;
  FilterableGrid: FilterableGridProps;
  SignPost: SignPostProps;
  SectionHeader: SectionHeaderProps;
  HomepageItemsAlias: any;
  About: any;
  HTMLEmbed: HTMLEmbedProps;
  Iframe: IframeProps;
  RichText: RichTextProps;
  MemberFrom: MemberFormProps
};

export type UserConfig = Config
// <
//   Props,
//   RootProps,
//   "layout" | "typography" | "interactive"
// >;

// We avoid the name config as next gets confused
export const conf: UserConfig = {
  root: {
    render: (props) => <Root {...props} />,
    fields: {
      title: {
        type: "text",
      },
      slug: {
        type: "text",
      },
      seoDescription: {
        type: "text",
      }
    },
  },
  categories: {
    specialLayout: {
      components: [
        "Hero",
        "FilterableGrid",
        "HomepageItemsAlias",
        "About"
      ],
    },
    pageLayout: {
      components: [
        "SectionHeader",
      ]
    },
    grid: {
      components: [
        "Card",
        "GridRow",
      ],
    },
    layout: {
      components: [
        "Columns",
        "Flex",
        "VerticalSpace"
      ],
    },
    content: {
      components: [
        "RichText",
        "HTMLEmbed",
        "Iframe",
        // "Image",
        // "EventList"
      ],
    }
  },
  // TODO: figure out why this cast to ComponentConfig<any>
  // is necessary, and components cannot be e.g.
  // ComponentConfig<CardProps>
  components: {
    Card: Card as ComponentConfig<any>,
    Columns: Columns as ComponentConfig<any>,
    Hero: Hero as ComponentConfig<any>,
    Flex: Flex as ComponentConfig<any>,
    PlainText: Text as ComponentConfig<any>,
    VerticalSpace: VerticalSpace as ComponentConfig<any>,
    GridRow: GridRow as ComponentConfig<any>,
    FilterableGrid: FilterableGrid as ComponentConfig<any>,
    SectionHeader: SectionHeader as ComponentConfig<any>,
    EventList: EventList as ComponentConfig<any>,
    Image: Image as ComponentConfig<any>,
    HomepageItemsAlias: HomepageItemsAlias as ComponentConfig<any>,
    RichText: RichText as ComponentConfig<any>,
    About: About as ComponentConfig<any>,
    HTMLEmbed: HTMLEmbed as ComponentConfig<any>,
    Iframe: Iframe as ComponentConfig<any>,
    MemberForm: MemberForm as ComponentConfig<any>,
  },
};