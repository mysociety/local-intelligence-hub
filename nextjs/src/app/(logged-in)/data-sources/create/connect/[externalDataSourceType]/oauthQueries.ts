import { gql } from '@apollo/client'

export const GOOGLE_SHEETS_OAUTH_URL = gql`
  query GoogleSheetsOauthUrl($redirectUrl: String!) {
    googleSheetsOauthUrl(redirectUrl: $redirectUrl)
  }
`

export const GOOGLE_SHEETS_OAUTH_CREDENTIALS = gql`
  query GoogleSheetsOauthCredentials(
    $redirectSuccessUrl: String!
    $externalDataSourceId: String
  ) {
    googleSheetsOauthCredentials(
      redirectSuccessUrl: $redirectSuccessUrl
      externalDataSourceId: $externalDataSourceId
    )
  }
`
