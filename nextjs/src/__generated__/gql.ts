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
    "\n  query UserInfo {\n    me {\n      firstName\n      lastName\n    }\n  }\n": types.UserInfoDocument,
    "\n  query PageForExternalDataSourceUpdateConfig($ID: ID!) {\n    externalDataSourceUpdateConfig(pk: $ID) {\n      id\n      externalDataSource {\n        id\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n      enabled\n      events {\n        scheduledAt\n        status\n        id\n        taskName\n        args\n      }\n    }\n  }\n": types.PageForExternalDataSourceUpdateConfigDocument,
    "\n  mutation DeleteSource($id: String!) {\n    deleteExternalDataSource(data: { id: $id }) {\n      id\n    }\n  }\n": types.DeleteSourceDocument,
    "\n  query CheckIfSourceHasConfig($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      updateConfigs {\n        id\n      }\n    }\n  }\n": types.CheckIfSourceHasConfigDocument,
    "\n  mutation CreateUpdateConfig($config: ExternalDataSourceUpdateConfigInput!) {\n    createExternalDataSourceUpdateConfig(data: $config) {\n      id\n    }\n  }\n": types.CreateUpdateConfigDocument,
    "\n  query TestAirtableSource($apiKey: String!, $baseId: String!, $tableId: String!) {\n    testAirtableSource(apiKey: $apiKey, baseId: $baseId, tableId: $tableId)\n  }\n": types.TestAirtableSourceDocument,
    "\n  mutation CreateAirtableSource($AirtableSource: AirtableSourceInput!) {\n    createAirtableSource(data: $AirtableSource) {\n      id\n      healthcheck\n    }\n  }\n": types.CreateAirtableSourceDocument,
    "\n  query PageForExternalDataSourceUpdateConfigReview($ID: ID!) {\n    externalDataSourceUpdateConfig(pk: $ID) {\n      id\n      externalDataSource {\n        id\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n      enabled\n      events {\n        scheduledAt\n        status\n      }\n    }\n  }\n": types.PageForExternalDataSourceUpdateConfigReviewDocument,
    "\n  query ListUpdateConfigs {\n    externalDataSourceUpdateConfigs {\n      id\n      externalDataSource {\n        id\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n      enabled\n      events {\n        scheduledAt\n        status\n      }\n    }\n  }\n": types.ListUpdateConfigsDocument,
    "\nmutation Login($username: String!, $password: String!) {\n  tokenAuth(username: $username, password: $password) {\n    errors\n    success\n    token {\n      token\n    }\n  }\n}\n": types.LoginDocument,
    "\n  fragment UpdateConfigCardFields on ExternalDataSourceUpdateConfig {\n    id\n    externalDataSource {\n      id\n      connectionDetails {\n        crmType: __typename\n      }\n    }\n    enabled\n    events {\n      scheduledAt\n      status\n    }\n  }\n": types.UpdateConfigCardFieldsFragmentDoc,
    "\n  mutation EnableUpdateConfig($ID: String!) {\n    enableUpdateConfig(configId: $ID) {\n      id\n      enabled\n      externalDataSource {\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n    }\n  } \n": types.EnableUpdateConfigDocument,
    "\n  mutation DisableUpdateConfig($ID: String!) {\n    disableUpdateConfig(configId: $ID) {\n      id\n      enabled\n      externalDataSource {\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n    }\n  } \n": types.DisableUpdateConfigDocument,
    "\n  query UserTest {\n    me {\n      id\n    }\n  }\n": types.UserTestDocument,
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
export function gql(source: "\n  query UserInfo {\n    me {\n      firstName\n      lastName\n    }\n  }\n"): (typeof documents)["\n  query UserInfo {\n    me {\n      firstName\n      lastName\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query PageForExternalDataSourceUpdateConfig($ID: ID!) {\n    externalDataSourceUpdateConfig(pk: $ID) {\n      id\n      externalDataSource {\n        id\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n      enabled\n      events {\n        scheduledAt\n        status\n        id\n        taskName\n        args\n      }\n    }\n  }\n"): (typeof documents)["\n  query PageForExternalDataSourceUpdateConfig($ID: ID!) {\n    externalDataSourceUpdateConfig(pk: $ID) {\n      id\n      externalDataSource {\n        id\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n      enabled\n      events {\n        scheduledAt\n        status\n        id\n        taskName\n        args\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DeleteSource($id: String!) {\n    deleteExternalDataSource(data: { id: $id }) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteSource($id: String!) {\n    deleteExternalDataSource(data: { id: $id }) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query CheckIfSourceHasConfig($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      updateConfigs {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  query CheckIfSourceHasConfig($ID: ID!) {\n    externalDataSource(pk: $ID) {\n      id\n      updateConfigs {\n        id\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateUpdateConfig($config: ExternalDataSourceUpdateConfigInput!) {\n    createExternalDataSourceUpdateConfig(data: $config) {\n      id\n    }\n  }\n"): (typeof documents)["\n  mutation CreateUpdateConfig($config: ExternalDataSourceUpdateConfigInput!) {\n    createExternalDataSourceUpdateConfig(data: $config) {\n      id\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query TestAirtableSource($apiKey: String!, $baseId: String!, $tableId: String!) {\n    testAirtableSource(apiKey: $apiKey, baseId: $baseId, tableId: $tableId)\n  }\n"): (typeof documents)["\n  query TestAirtableSource($apiKey: String!, $baseId: String!, $tableId: String!) {\n    testAirtableSource(apiKey: $apiKey, baseId: $baseId, tableId: $tableId)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation CreateAirtableSource($AirtableSource: AirtableSourceInput!) {\n    createAirtableSource(data: $AirtableSource) {\n      id\n      healthcheck\n    }\n  }\n"): (typeof documents)["\n  mutation CreateAirtableSource($AirtableSource: AirtableSourceInput!) {\n    createAirtableSource(data: $AirtableSource) {\n      id\n      healthcheck\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query PageForExternalDataSourceUpdateConfigReview($ID: ID!) {\n    externalDataSourceUpdateConfig(pk: $ID) {\n      id\n      externalDataSource {\n        id\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n      enabled\n      events {\n        scheduledAt\n        status\n      }\n    }\n  }\n"): (typeof documents)["\n  query PageForExternalDataSourceUpdateConfigReview($ID: ID!) {\n    externalDataSourceUpdateConfig(pk: $ID) {\n      id\n      externalDataSource {\n        id\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n      enabled\n      events {\n        scheduledAt\n        status\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query ListUpdateConfigs {\n    externalDataSourceUpdateConfigs {\n      id\n      externalDataSource {\n        id\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n      enabled\n      events {\n        scheduledAt\n        status\n      }\n    }\n  }\n"): (typeof documents)["\n  query ListUpdateConfigs {\n    externalDataSourceUpdateConfigs {\n      id\n      externalDataSource {\n        id\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n      enabled\n      events {\n        scheduledAt\n        status\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nmutation Login($username: String!, $password: String!) {\n  tokenAuth(username: $username, password: $password) {\n    errors\n    success\n    token {\n      token\n    }\n  }\n}\n"): (typeof documents)["\nmutation Login($username: String!, $password: String!) {\n  tokenAuth(username: $username, password: $password) {\n    errors\n    success\n    token {\n      token\n    }\n  }\n}\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  fragment UpdateConfigCardFields on ExternalDataSourceUpdateConfig {\n    id\n    externalDataSource {\n      id\n      connectionDetails {\n        crmType: __typename\n      }\n    }\n    enabled\n    events {\n      scheduledAt\n      status\n    }\n  }\n"): (typeof documents)["\n  fragment UpdateConfigCardFields on ExternalDataSourceUpdateConfig {\n    id\n    externalDataSource {\n      id\n      connectionDetails {\n        crmType: __typename\n      }\n    }\n    enabled\n    events {\n      scheduledAt\n      status\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation EnableUpdateConfig($ID: String!) {\n    enableUpdateConfig(configId: $ID) {\n      id\n      enabled\n      externalDataSource {\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n    }\n  } \n"): (typeof documents)["\n  mutation EnableUpdateConfig($ID: String!) {\n    enableUpdateConfig(configId: $ID) {\n      id\n      enabled\n      externalDataSource {\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n    }\n  } \n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation DisableUpdateConfig($ID: String!) {\n    disableUpdateConfig(configId: $ID) {\n      id\n      enabled\n      externalDataSource {\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n    }\n  } \n"): (typeof documents)["\n  mutation DisableUpdateConfig($ID: String!) {\n    disableUpdateConfig(configId: $ID) {\n      id\n      enabled\n      externalDataSource {\n        connectionDetails {\n          crmType: __typename\n        }\n      }\n    }\n  } \n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query UserTest {\n    me {\n      id\n    }\n  }\n"): (typeof documents)["\n  query UserTest {\n    me {\n      id\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;