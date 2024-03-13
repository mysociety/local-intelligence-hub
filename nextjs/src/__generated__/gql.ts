/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n  mutation Verify($token: String!) {\n    verifyAccount(token: $token) {\n      errors\n      success\n    }\n  }\n": types.VerifyDocument,
    "\n  query Example {\n    organisations {\n      id\n      name\n    }\n  }\n": types.ExampleDocument,
    "\n  query ListExternalDataSources {\n    externalDataSources {\n      id\n      name\n      dataType\n      connectionDetails {\n        crmType: __typename\n      }\n      autoUpdateEnabled\n      jobs {\n        lastEventAt\n        status\n      }\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n    }\n  }\n": types.ListExternalDataSourcesDocument,
    "\n  query GetSourceMapping($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      autoUpdateEnabled\n      updateMapping {\n        destinationColumn\n        source\n        sourcePath\n      }\n      geographyColumn\n      geographyColumnType\n    }\n  }\n": types.GetSourceMappingDocument,
    "\n  query TestAirtableSource(\n    $apiKey: String!\n    $baseId: String!\n    $tableId: String!\n  ) {\n    testAirtableSource(apiKey: $apiKey, baseId: $baseId, tableId: $tableId)\n  }\n": types.TestAirtableSourceDocument,
    "\n  mutation CreateAirtableSource($AirtableSource: AirtableSourceInput!) {\n    createAirtableSource(data: $AirtableSource) {\n      id\n      name\n      healthcheck\n      dataType\n    }\n  }\n": types.CreateAirtableSourceDocument,
    "\n  query AllExternalDataSources {\n    externalDataSources {\n      id\n      name\n      createdAt\n      dataType\n      connectionDetails {\n        crmType: __typename\n        ... on AirtableSource {\n          baseId\n          tableId\n        }\n      }\n      autoUpdateEnabled\n    }\n  }\n": types.AllExternalDataSourcesDocument,
    "\n  query AutoUpdateCreationReview($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      name\n      geographyColumn\n      connectionDetails {\n        crmType: __typename\n      }\n      autoUpdateEnabled\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n      jobs {\n        lastEventAt\n        status\n      }\n    }\n  }\n": types.AutoUpdateCreationReviewDocument,
    "\n  query ExternalDataSourceInspectPage($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      name\n      dataType\n      connectionDetails {\n        crmType: __typename\n        ... on AirtableSource {\n          baseId\n          tableId\n          apiKey\n        }\n      }\n      autoUpdateEnabled\n      webhookHealthcheck\n      geographyColumn\n      geographyColumnType\n      jobs {\n        status\n        id\n        taskName\n        args\n        lastEventAt\n      }\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n    }\n  }\n": types.ExternalDataSourceInspectPageDocument,
    "\n  mutation DeleteUpdateConfig($id: String!) {\n    deleteExternalDataSource(data: { id: $id }) {\n      id\n    }\n  }\n": types.DeleteUpdateConfigDocument,
    "\n  query ExternalDataSourceName($externalDataSourceId: ID!) {\n    externalDataSource(pk: $externalDataSourceId) {\n      name\n    }\n  }\n": types.ExternalDataSourceNameDocument,
    "\n  mutation Login($username: String!, $password: String!) {\n    tokenAuth(username: $username, password: $password) {\n      errors\n      success\n      token {\n        token\n        payload {\n          exp\n        }\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation Register($email: String!, $password1: String!, $password2: String!, $username: String!) {\n    register(email: $email, password1: $password1, password2: $password2, username: $username) {\n      errors\n      success\n    }\n  }\n": types.RegisterDocument,
    "\n  mutation AutoUpdateWebhookRefresh($ID: String!) {\n    refreshWebhooks(externalDataSourceId: $ID) {\n      id\n      webhookHealthcheck\n    }\n  }\n": types.AutoUpdateWebhookRefreshDocument,
    "\n  fragment AutoUpdateCardFields on ExternalDataSource {\n    id\n    name\n    dataType\n    connectionDetails {\n      crmType: __typename\n    }\n    autoUpdateEnabled\n    updateMapping {\n      source\n      sourcePath\n      destinationColumn\n    }\n    jobs {\n      lastEventAt\n      status\n    }\n  }\n": types.AutoUpdateCardFieldsFragmentDoc,
    "\n  query ExternalDataSourceAutoUpdateCard($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      ...AutoUpdateCardFields\n    }\n  }\n  \n": types.ExternalDataSourceAutoUpdateCardDocument,
    "\n  mutation EnableAutoUpdate($ID: String!) {\n    enableAutoUpdate(externalDataSourceId: $ID) {\n      id\n      autoUpdateEnabled\n      webhookHealthcheck\n      name\n    }\n  }\n": types.EnableAutoUpdateDocument,
    "\n  mutation DisableAutoUpdate($ID: String!) {\n    disableAutoUpdate(externalDataSourceId: $ID) {\n      id\n      autoUpdateEnabled\n      webhookHealthcheck\n      name\n    }\n  }\n": types.DisableAutoUpdateDocument,
    "\n  mutation TriggerFullUpdate($externalDataSourceId: String!) {\n    triggerUpdate(externalDataSourceId: $externalDataSourceId) {\n      id\n      jobs {\n        status\n        id\n        taskName\n        args\n        lastEventAt\n      }\n      id\n      name\n      connectionDetails {\n        crmType: __typename\n      }\n    }\n  }\n": types.TriggerFullUpdateDocument,
    "\n  fragment ExternalDataSourceCardFields on ExternalDataSource {\n    id\n    name\n    connectionDetails {\n      crmType: __typename\n    }\n  }\n": types.ExternalDataSourceCardFieldsFragmentDoc,
    "\n  query ExternalDataSourceCard($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      ...ExternalDataSourceCardFields\n    }\n  }\n  \n": types.ExternalDataSourceCardDocument,
    "\n  query EnrichmentLayers {\n    externalDataSources {\n      id\n      name\n      geographyColumn\n      geographyColumnType\n      dataType\n      fieldDefinitions {\n        label\n        value\n        description\n      }\n    }\n  }\n": types.EnrichmentLayersDocument,
    "\n  mutation UpdateExternalDataSource($input: ExternalDataSourceInput!) {\n    updateExternalDataSource(data: $input) {\n      id\n      name\n      geographyColumn\n      geographyColumnType\n      autoUpdateEnabled\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n    }\n  }\n": types.UpdateExternalDataSourceDocument,
    "\n  query PublicUser {\n    publicUser {\n      id\n      username\n      email\n    }\n  }\n": types.PublicUserDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Verify($token: String!) {\n    verifyAccount(token: $token) {\n      errors\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation Verify($token: String!) {\n    verifyAccount(token: $token) {\n      errors\n      success\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Example {\n    organisations {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query Example {\n    organisations {\n      id\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query ListExternalDataSources {\n    externalDataSources {\n      id\n      name\n      dataType\n      connectionDetails {\n        crmType: __typename\n      }\n      autoUpdateEnabled\n      jobs {\n        lastEventAt\n        status\n      }\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n    }\n  }\n"): (typeof documents)["\n  query ListExternalDataSources {\n    externalDataSources {\n      id\n      name\n      dataType\n      connectionDetails {\n        crmType: __typename\n      }\n      autoUpdateEnabled\n      jobs {\n        lastEventAt\n        status\n      }\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetSourceMapping($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      autoUpdateEnabled\n      updateMapping {\n        destinationColumn\n        source\n        sourcePath\n      }\n      geographyColumn\n      geographyColumnType\n    }\n  }\n"): (typeof documents)["\n  query GetSourceMapping($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      autoUpdateEnabled\n      updateMapping {\n        destinationColumn\n        source\n        sourcePath\n      }\n      geographyColumn\n      geographyColumnType\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query TestAirtableSource(\n    $apiKey: String!\n    $baseId: String!\n    $tableId: String!\n  ) {\n    testAirtableSource(apiKey: $apiKey, baseId: $baseId, tableId: $tableId)\n  }\n"): (typeof documents)["\n  query TestAirtableSource(\n    $apiKey: String!\n    $baseId: String!\n    $tableId: String!\n  ) {\n    testAirtableSource(apiKey: $apiKey, baseId: $baseId, tableId: $tableId)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateAirtableSource($AirtableSource: AirtableSourceInput!) {\n    createAirtableSource(data: $AirtableSource) {\n      id\n      name\n      healthcheck\n      dataType\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAirtableSource($AirtableSource: AirtableSourceInput!) {\n    createAirtableSource(data: $AirtableSource) {\n      id\n      name\n      healthcheck\n      dataType\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query AllExternalDataSources {\n    externalDataSources {\n      id\n      name\n      createdAt\n      dataType\n      connectionDetails {\n        crmType: __typename\n        ... on AirtableSource {\n          baseId\n          tableId\n        }\n      }\n      autoUpdateEnabled\n    }\n  }\n"): (typeof documents)["\n  query AllExternalDataSources {\n    externalDataSources {\n      id\n      name\n      createdAt\n      dataType\n      connectionDetails {\n        crmType: __typename\n        ... on AirtableSource {\n          baseId\n          tableId\n        }\n      }\n      autoUpdateEnabled\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query AutoUpdateCreationReview($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      name\n      geographyColumn\n      connectionDetails {\n        crmType: __typename\n      }\n      autoUpdateEnabled\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n      jobs {\n        lastEventAt\n        status\n      }\n    }\n  }\n"): (typeof documents)["\n  query AutoUpdateCreationReview($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      name\n      geographyColumn\n      connectionDetails {\n        crmType: __typename\n      }\n      autoUpdateEnabled\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n      jobs {\n        lastEventAt\n        status\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query ExternalDataSourceInspectPage($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      name\n      dataType\n      connectionDetails {\n        crmType: __typename\n        ... on AirtableSource {\n          baseId\n          tableId\n          apiKey\n        }\n      }\n      autoUpdateEnabled\n      webhookHealthcheck\n      geographyColumn\n      geographyColumnType\n      jobs {\n        status\n        id\n        taskName\n        args\n        lastEventAt\n      }\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n    }\n  }\n"): (typeof documents)["\n  query ExternalDataSourceInspectPage($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      name\n      dataType\n      connectionDetails {\n        crmType: __typename\n        ... on AirtableSource {\n          baseId\n          tableId\n          apiKey\n        }\n      }\n      autoUpdateEnabled\n      webhookHealthcheck\n      geographyColumn\n      geographyColumnType\n      jobs {\n        status\n        id\n        taskName\n        args\n        lastEventAt\n      }\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteUpdateConfig($id: String!) {\n    deleteExternalDataSource(data: { id: $id }) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteUpdateConfig($id: String!) {\n    deleteExternalDataSource(data: { id: $id }) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query ExternalDataSourceName($externalDataSourceId: ID!) {\n    externalDataSource(pk: $externalDataSourceId) {\n      name\n    }\n  }\n"): (typeof documents)["\n  query ExternalDataSourceName($externalDataSourceId: ID!) {\n    externalDataSource(pk: $externalDataSourceId) {\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Login($username: String!, $password: String!) {\n    tokenAuth(username: $username, password: $password) {\n      errors\n      success\n      token {\n        token\n        payload {\n          exp\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Login($username: String!, $password: String!) {\n    tokenAuth(username: $username, password: $password) {\n      errors\n      success\n      token {\n        token\n        payload {\n          exp\n        }\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation Register($email: String!, $password1: String!, $password2: String!, $username: String!) {\n    register(email: $email, password1: $password1, password2: $password2, username: $username) {\n      errors\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation Register($email: String!, $password1: String!, $password2: String!, $username: String!) {\n    register(email: $email, password1: $password1, password2: $password2, username: $username) {\n      errors\n      success\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation AutoUpdateWebhookRefresh($ID: String!) {\n    refreshWebhooks(externalDataSourceId: $ID) {\n      id\n      webhookHealthcheck\n    }\n  }\n"): (typeof documents)["\n  mutation AutoUpdateWebhookRefresh($ID: String!) {\n    refreshWebhooks(externalDataSourceId: $ID) {\n      id\n      webhookHealthcheck\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  fragment AutoUpdateCardFields on ExternalDataSource {\n    id\n    name\n    dataType\n    connectionDetails {\n      crmType: __typename\n    }\n    autoUpdateEnabled\n    updateMapping {\n      source\n      sourcePath\n      destinationColumn\n    }\n    jobs {\n      lastEventAt\n      status\n    }\n  }\n"): (typeof documents)["\n  fragment AutoUpdateCardFields on ExternalDataSource {\n    id\n    name\n    dataType\n    connectionDetails {\n      crmType: __typename\n    }\n    autoUpdateEnabled\n    updateMapping {\n      source\n      sourcePath\n      destinationColumn\n    }\n    jobs {\n      lastEventAt\n      status\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query ExternalDataSourceAutoUpdateCard($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      ...AutoUpdateCardFields\n    }\n  }\n  \n"): (typeof documents)["\n  query ExternalDataSourceAutoUpdateCard($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      ...AutoUpdateCardFields\n    }\n  }\n  \n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation EnableAutoUpdate($ID: String!) {\n    enableAutoUpdate(externalDataSourceId: $ID) {\n      id\n      autoUpdateEnabled\n      webhookHealthcheck\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation EnableAutoUpdate($ID: String!) {\n    enableAutoUpdate(externalDataSourceId: $ID) {\n      id\n      autoUpdateEnabled\n      webhookHealthcheck\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DisableAutoUpdate($ID: String!) {\n    disableAutoUpdate(externalDataSourceId: $ID) {\n      id\n      autoUpdateEnabled\n      webhookHealthcheck\n      name\n    }\n  }\n"): (typeof documents)["\n  mutation DisableAutoUpdate($ID: String!) {\n    disableAutoUpdate(externalDataSourceId: $ID) {\n      id\n      autoUpdateEnabled\n      webhookHealthcheck\n      name\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation TriggerFullUpdate($externalDataSourceId: String!) {\n    triggerUpdate(externalDataSourceId: $externalDataSourceId) {\n      id\n      jobs {\n        status\n        id\n        taskName\n        args\n        lastEventAt\n      }\n      id\n      name\n      connectionDetails {\n        crmType: __typename\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation TriggerFullUpdate($externalDataSourceId: String!) {\n    triggerUpdate(externalDataSourceId: $externalDataSourceId) {\n      id\n      jobs {\n        status\n        id\n        taskName\n        args\n        lastEventAt\n      }\n      id\n      name\n      connectionDetails {\n        crmType: __typename\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  fragment ExternalDataSourceCardFields on ExternalDataSource {\n    id\n    name\n    connectionDetails {\n      crmType: __typename\n    }\n  }\n"): (typeof documents)["\n  fragment ExternalDataSourceCardFields on ExternalDataSource {\n    id\n    name\n    connectionDetails {\n      crmType: __typename\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query ExternalDataSourceCard($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      ...ExternalDataSourceCardFields\n    }\n  }\n  \n"): (typeof documents)["\n  query ExternalDataSourceCard($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      ...ExternalDataSourceCardFields\n    }\n  }\n  \n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query EnrichmentLayers {\n    externalDataSources {\n      id\n      name\n      geographyColumn\n      geographyColumnType\n      dataType\n      fieldDefinitions {\n        label\n        value\n        description\n      }\n    }\n  }\n"): (typeof documents)["\n  query EnrichmentLayers {\n    externalDataSources {\n      id\n      name\n      geographyColumn\n      geographyColumnType\n      dataType\n      fieldDefinitions {\n        label\n        value\n        description\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation UpdateExternalDataSource($input: ExternalDataSourceInput!) {\n    updateExternalDataSource(data: $input) {\n      id\n      name\n      geographyColumn\n      geographyColumnType\n      autoUpdateEnabled\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateExternalDataSource($input: ExternalDataSourceInput!) {\n    updateExternalDataSource(data: $input) {\n      id\n      name\n      geographyColumn\n      geographyColumnType\n      autoUpdateEnabled\n      updateMapping {\n        source\n        sourcePath\n        destinationColumn\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query PublicUser {\n    publicUser {\n      id\n      username\n      email\n    }\n  }\n"): (typeof documents)["\n  query PublicUser {\n    publicUser {\n      id\n      username\n      email\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;