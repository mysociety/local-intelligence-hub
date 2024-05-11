import { CrmType } from "@/__generated__/graphql";
import { AirtableLogo, ActionNetworkLogo, MailchimpIcon, MailchimpLogo, GoogleSheetsLogo, CiviCRMLogo, NationBuilderLogo, AirtableIcon, ActionNetworkIcon } from "@/components/logos";

export const externalDataSourceOptions: Record<CrmType, {
  key: CrmType,
  modelName: string, 
  name: string,
  icon?: ({ className }: { className?: string | undefined; }) => any,
  logo: ({ className }: { className?: string | undefined; }) => any,
  screenshot: string,
  supported: boolean
}> = {
  [CrmType.Airtable]: {
    key: CrmType.Airtable,
    modelName: "AirtableSource",
    name: "Airtable",
    icon: AirtableIcon,
    logo: AirtableLogo,
    screenshot: "/airtable-screenshot.png",
    supported: true
  },
  [CrmType.Actionnetwork]: {
    key: CrmType.Actionnetwork,
    modelName: "actionNetworkSource",
    name: "Action Network",
    icon: ActionNetworkIcon,
    logo: ActionNetworkLogo,
    screenshot: "/actionNetwork-screenshot.png",
    supported: true
  },
  [CrmType.Mailchimp]: {
    key: CrmType.Mailchimp,
    modelName: "mailchimpSource",
    name: "Mailchimp",
    icon: MailchimpIcon,
    logo: MailchimpLogo,
    screenshot: "/mailchimp-screenshot.png",
    supported: true
  },
  // googleSheets: {
  //   key: "google-sheets",
  //   modelName: "googleSheetsSource",
  //   name: "Google Sheets",
  //   logo: GoogleSheetsLogo,
  //   screenshot: "/googleSheets-screenshot.png",
  //   supported: false
  // },
  // civiCRM: {
  //   key: "civi-crm",
  //   modelName: "civiCRMSource",
  //   name: "Civi CRM",
  //   logo: CiviCRMLogo,
  //   screenshot: "/civiCRM-screenshot.png",
  //   supported: false
  // },
  // nationBuilder: {
  //   key: "nation-builder",
  //   modelName: "nationBuilderSource",
  //   name: "NationBuilder",
  //   logo: NationBuilderLogo,
  //   screenshot: "/nationBuilder-screenshot.png",
  //   supported: false
  // },
};


export const getSourceOptionForTypename = (typename: string) => {
  return Object.values(externalDataSourceOptions).find(
    (option) => option.modelName === typename,
  );
};

export type SourcePath =
  | {
      value: string;
      label?: string | null;
      description?: string | null;
    }
  | string;