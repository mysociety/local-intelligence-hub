import {
  SourceMetadataQuery,
  SourceMetadataQueryVariables,
} from '@/__generated__/graphql'
import { gql, useQuery } from '@apollo/client'

export function useSourceMetadata(sourceId?: string) {
  return useQuery<SourceMetadataQuery, SourceMetadataQueryVariables>(
    SOURCE_METADATA,
    {
      variables: {
        sourceId: sourceId!,
      },
      skip: !sourceId,
    }
  )
}

const SOURCE_METADATA = gql`
  query SourceMetadata($sourceId: ID!) {
    externalDataSource(id: $sourceId) {
      fieldDefinitions {
        externalId
        value
        label
      }
    }
  }
`
