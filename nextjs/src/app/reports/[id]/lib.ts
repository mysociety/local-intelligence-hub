import { MAP_REPORT_FRAGMENT } from '@/lib/map'
import { gql } from '@apollo/client'

export const GET_MAP_REPORT = gql`
  query GetMapReport($id: ID!) {
    mapReport(pk: $id) {
      id
      name
      slug
      displayOptions
      organisation {
        id
        slug
        name
      }
      ...MapReportPage
    }
  }
  ${MAP_REPORT_FRAGMENT}
`
// Keep this fragment trim
// so that updates return fast
export const UPDATE_MAP_REPORT = gql`
  mutation UpdateMapReport($input: MapReportInput!) {
    updateMapReport(data: $input) {
      id
      name
      displayOptions
      layers {
        id
        name
        source {
          id
          name
        }
      }
    }
  }
`
export const DELETE_MAP_REPORT = gql`
  mutation DeleteMapReport($id: IDObject!) {
    deleteMapReport(data: $id) {
      id
    }
  }
`
