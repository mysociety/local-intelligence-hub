'use client'

import { gql } from '@apollo/client'

export const MAP_REPORT_LAYER_POINT = gql`
  query MapReportLayerGeoJSONPoint($genericDataId: String!) {
    importedDataGeojsonPoint(genericDataId: $genericDataId) {
      id
      type
      geometry {
        type
        coordinates
      }
      properties {
        id
        lastUpdate
        name
        phone
        email
        postcodeData {
          postcode
        }
        address
        json
        remoteUrl
        dataType {
          id
          dataSet {
            id
            externalDataSource {
              id
              name
              dataType
            }
          }
        }
      }
    }
  }
`

export const MAP_REPORT_LAYER_ANALYTICS = gql`
  query MapReportLayerAnalytics($reportID: ID!) {
    mapReport(pk: $reportID) {
      id
      layers {
        id
        name
        mapboxPaint
        mapboxLayout
        source
        sourceData {
          id
          dataType
          organisation {
            name
          }
        }
      }
    }
  }
`

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
      layers {
        id
        name
        inspectorType
        inspectorConfig
        mapboxPaint
        mapboxLayout
        sharingPermission {
          visibilityRecordDetails
          visibilityRecordCoordinates
          organisation {
            name
          }
        }
        source
        sourceData {
          id
          name
          isImportScheduled
          importedDataCount
          idField
          crmType
          dataType
          organisation {
            name
          }
          fieldDefinitions {
            externalId
            value
            label
          }
        }
      }
    }
  }
`

// Keep this fragment trim
// so that updates return fast
export const PATCH_MAP_REPORT = gql`
  mutation PatchMapReport($patch: JSON!, $reportId: String!) {
    patchMapReportDisplayOptions(patch: $patch, reportId: $reportId) {
      id
      name
      displayOptions
      layers {
        id
        name
        source
        sourceData {
          id
          name
        }
        inspectorType
        inspectorConfig
        mapboxPaint
        mapboxLayout
      }
    }
  }
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
        source
        sourceData {
          id
          name
        }
        inspectorType
        inspectorConfig
        mapboxPaint
        mapboxLayout
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
