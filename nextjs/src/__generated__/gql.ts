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
    "\n  query ListDataSyncs {\n    organisations {\n      id\n      name\n    }\n    externalDataSourceUpdateConfigs {\n      externalDataSource {\n        id\n        __typename\n      }\n      id\n      enabled\n      events(pagination: { limit: 3 }) {\n        scheduledAt\n        status\n      }\n    }\n  }\n": types.ListDataSyncsDocument,
    "\nmutation Login($username: String!, $password: String!) {\n  tokenAuth(username: $username, password: $password) {\n    errors\n    success\n    token {\n      token\n    }\n  }\n}\n": types.LoginDocument,
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
export function gql(source: "\n  query ListDataSyncs {\n    organisations {\n      id\n      name\n    }\n    externalDataSourceUpdateConfigs {\n      externalDataSource {\n        id\n        __typename\n      }\n      id\n      enabled\n      events(pagination: { limit: 3 }) {\n        scheduledAt\n        status\n      }\n    }\n  }\n"): (typeof documents)["\n  query ListDataSyncs {\n    organisations {\n      id\n      name\n    }\n    externalDataSourceUpdateConfigs {\n      externalDataSource {\n        id\n        __typename\n      }\n      id\n      enabled\n      events(pagination: { limit: 3 }) {\n        scheduledAt\n        status\n      }\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\nmutation Login($username: String!, $password: String!) {\n  tokenAuth(username: $username, password: $password) {\n    errors\n    success\n    token {\n      token\n    }\n  }\n}\n"): (typeof documents)["\nmutation Login($username: String!, $password: String!) {\n  tokenAuth(username: $username, password: $password) {\n    errors\n    success\n    token {\n      token\n    }\n  }\n}\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query UserTest {\n    me {\n      id\n    }\n  }\n"): (typeof documents)["\n  query UserTest {\n    me {\n      id\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;