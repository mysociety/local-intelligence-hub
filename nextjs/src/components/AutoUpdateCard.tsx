import { formatRelative } from "date-fns";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import {
  ApolloClient,
  FetchResult,
  gql,
  useApolloClient,
  useMutation,
} from "@apollo/client";
import { toast } from "sonner";
import { Button, ButtonProps, buttonVariants } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getSourceOptionForTypename } from "@/lib/data";
import { DataSourceCardFragment, AutoUpdateWebhookRefreshMutation, AutoUpdateWebhookRefreshMutationVariables, DataSourceType, DisableAutoUpdateMutation, DisableAutoUpdateMutationVariables, EnableAutoUpdateMutation, EnableAutoUpdateMutationVariables, TriggerFullUpdateMutation, TriggerFullUpdateMutationVariables } from "@/__generated__/graphql";
import { DATA_SOURCE_FRAGMENT, TRIGGER_FULL_UPDATE } from "./ExternalDataSourceCard";

export function AutoUpdateCard({
  externalDataSource,
}: {
  externalDataSource: DataSourceCardFragment
}) {
  const Logo = getSourceOptionForTypename(
    externalDataSource.crmType,
  )!.logo;

  return (
    <article className="rounded-xl border border-meepGray-600 px-6 py-5 space-y-3">
      <header className="flex flex-row justify-between items-start">
        <div className='space-y-3'>
          <Logo className='w-20'/>
          <h3 className="text-hSm">
            {externalDataSource.name}
          </h3>
        </div>
        <Link href={`/data-sources/inspect/${externalDataSource.id}`}>
          <CogIcon />
        </Link>
      </header>
      {externalDataSource.dataType === DataSourceType.Member && (
        <AutoUpdateSwitch externalDataSource={externalDataSource} />
      )}
      {externalDataSource?.jobs?.[0]?.lastEventAt ? (
        <div className="text-sm text-meepGray-400">
          Last background task <span className='text-meepGray-300'>{externalDataSource.jobs[0].status}</span>{" "}
          {formatRelative(externalDataSource.jobs[0].lastEventAt, new Date())}
        </div>
      ) : null}
    </article>
  );
}

export function AutoUpdateSwitch({
  externalDataSource,
}: {
  externalDataSource: any;
}) {
  const client = useApolloClient();
  return (
    <div className="flex flex-row items-center justify-start gap-2 text-label">
      <Switch
        checked={externalDataSource.autoUpdateEnabled}
        onCheckedChange={(e) =>
          toggleAutoUpdate(client, e, externalDataSource.id)
        }
      />
      <span className={externalDataSource.autoUpdateEnabled ? "text-brandBlue" : ''}>Auto-update</span>
    </div>
  );
}

const AUTO_UPDATE_WEBHOOK_REFRESH = gql`
  mutation AutoUpdateWebhookRefresh($ID: String!) {
    refreshWebhooks(externalDataSourceId: $ID) {
      id
      webhookHealthcheck
    }
  }
`;

export function AutoUpdateWebhookRefresh({
  externalDataSourceId,
}: {
  externalDataSourceId: string;
}) {
  const [mutate, mutation] = useMutation<AutoUpdateWebhookRefreshMutation, AutoUpdateWebhookRefreshMutationVariables>(AUTO_UPDATE_WEBHOOK_REFRESH, {
    variables: { ID: externalDataSourceId },
  });

  return (
    <Button onClick={() => trigger()} disabled={mutation.loading}>
      Refresh webhooks
    </Button>
  );

  function trigger() {
    toast.promise(mutate(), {
      loading: "Refreshing...",
      success: "Refreshed webhooks",
      error: "Couldn't refresh webhooks",
    });
  }
}

export function TriggerUpdateButton({
  id,
  label = "Trigger full update",
  ...buttonProps
}: {
  id: string;
  label?: string;
} & ButtonProps) {
  const client = useApolloClient();

  return (
    <AlertDialog>
      <AlertDialogTrigger {...buttonProps}>
        <Button variant='outline' {...buttonProps} asChild={true}>
          <span>{label}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Trigger a full update</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            This will update all records in the CRM. Depending on the size of
            your CRM, this may take a while.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={buttonVariants({ variant: "outline" })}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              trigger();
            }}
            className={buttonVariants({ variant: "reverse" })}
          >
            Trigger update
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  function trigger() {
    const mutation = client.mutate<
      TriggerFullUpdateMutation,
      TriggerFullUpdateMutationVariables
    >({
      mutation: TRIGGER_FULL_UPDATE,
      variables: { externalDataSourceId: id },
    });
    toast.promise(mutation, {
      loading: "Triggering...",
      success: (d: FetchResult<TriggerFullUpdateMutation>) => {
        return `Triggered sync for ${d.data?.triggerUpdate.externalDataSource.name}`;
      },
      error: `Couldn't trigger sync`,
    });
  }
}

export function toggleAutoUpdate(
  client: ApolloClient<any>,
  checked: boolean,
  id: any,
) {
  if (checked) {
    const mutation = client.mutate<
      EnableAutoUpdateMutation,
      EnableAutoUpdateMutationVariables
    >({
      mutation: ENABLE_AUTO_UPDATE,
      variables: { ID: id },
    });
    toast.promise(mutation, {
      loading: "Enabling...",
      success: (d: FetchResult<EnableAutoUpdateMutation>) => {
        return `Enabled auto-updates for ${d.data?.enableAutoUpdate.name}`;
      },
      error: `Couldn't enable auto-updates`,
    });
  } else {
    const mutation = client.mutate<
      DisableAutoUpdateMutation,
      DisableAutoUpdateMutationVariables
    >({
      mutation: DISABLE_AUTO_UPDATE,
      variables: { ID: id },
    });
    toast.promise(mutation, {
      loading: "Disabling...",
      success: (d: FetchResult<DisableAutoUpdateMutation>) => {
        return `Disabled auto-updates for ${d.data?.disableAutoUpdate.name}`;
      },
      error: `Couldn't disable auto-updates`,
    });
  }
}

export const GET_UPDATE_CONFIG_CARD = gql`
  query ExternalDataSourceAutoUpdateCard($ID: ID!) {
    externalDataSource(pk: $ID) {
      ...DataSourceCard
    }
  }
  ${DATA_SOURCE_FRAGMENT}
`;

export const ENABLE_AUTO_UPDATE = gql`
  mutation EnableAutoUpdate($ID: String!) {
    enableAutoUpdate(externalDataSourceId: $ID) {
      id
      autoUpdateEnabled
      webhookHealthcheck
      name
    }
  }
`;

export const DISABLE_AUTO_UPDATE = gql`
  mutation DisableAutoUpdate($ID: String!) {
    disableAutoUpdate(externalDataSourceId: $ID) {
      id
      autoUpdateEnabled
      webhookHealthcheck
      name
    }
  }
`;

export function CogIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}