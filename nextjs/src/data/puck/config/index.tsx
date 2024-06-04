import { Config } from "@measured/puck";
import { PuckRichText } from "@tohuhono/puck-rich-text"
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

export type Props = {
  ButtonGroup: ButtonGroupProps;
  Card: CardProps;
  Columns: ColumnsProps;
  Hero: HeroProps;
  Heading: HeadingProps;
  Flex: FlexProps;
  Logos: LogosProps;
  Stats: StatsProps;
  Text: TextProps;
  VerticalSpace: VerticalSpaceProps;
  EventCard: EventCardProps;
  GridRow: GridRowProps;
  FilterableGrid: FilterableGridProps;
  SignPost: SignPostProps;
  SectionHeader: SectionHeaderProps;
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
    defaultProps: {
      title: "My Page",
    },
    render: Root,
  },
  categories: {
    components: {
      components: [
        "Card",
        "Hero",
        "EventCard",
        "SignPost",
        "SectionHeader"
      ],
    },
    layout: {
      components: [
        "FilterableGrid",
        "GridRow",
        "Columns",
        "Flex",
        "VerticalSpace"
      ],
    },
    text: {
      components: [
        "Heading",
        "RichText",
        "PlainText"
      ],
    },
    interactive: {
      title: "Actions",
      components: ["ButtonGroup"],
    },
  },
  components: {
    ButtonGroup,
    Card,
    Columns,
    Hero,
    Heading,
    Flex,
    PlainText: Text,
    VerticalSpace,
    EventCard,
    GridRow,
    FilterableGrid,
    SignPost,
    SectionHeader,

    RichText: PuckRichText
  },
};