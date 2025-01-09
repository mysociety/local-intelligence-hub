import {
  ExternalDataSourceInspectPageQuery,
  ExternalDataSourceInspectPageQueryVariables,
  MapReportLayerGeoJsonPointQuery,
  MapReportLayerGeoJsonPointQueryVariables,
} from '@/__generated__/graphql'
import { dataTypeIcons } from '@/lib/data'
import { selectedSourceMarkerAtom } from '@/lib/map'
import { gql, useQuery } from '@apollo/client'
import { Point } from 'geojson'
import { useAtom } from 'jotai'
import { ErrorBoundary } from 'next/dist/client/components/error-boundary'
import React from 'react'
import { Popup } from 'react-map-gl'
import { MAP_REPORT_LAYER_POINT } from '../gql_queries'
import useMarkerAnalytics from '../useMarkerAnalytics'

const MarkerPopup: React.FC<{ externalDataSourceId: string }> = ({
  externalDataSourceId,
}) => {
  /* Get the analytics data for the report */
  const analytics = useMarkerAnalytics()

  const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(
    selectedSourceMarkerAtom
  )

  const { data: selectedPointData, loading: selectedPointLoading } = useQuery<
    MapReportLayerGeoJsonPointQuery,
    MapReportLayerGeoJsonPointQueryVariables
  >(MAP_REPORT_LAYER_POINT, {
    skip: !selectedSourceMarker?.properties?.id,
    variables: {
      genericDataId: String(selectedSourceMarker?.properties?.id),
    },
  })

  const { loading, data: dataTypeData } = useQuery<
    ExternalDataSourceInspectPageQuery,
    ExternalDataSourceInspectPageQueryVariables
  >(GET_DATA_TYPE, {
    variables: {
      ID: externalDataSourceId,
    },
    pollInterval: 5000,
  })

  const dataType = dataTypeData?.externalDataSource.dataType

  const IconComponent = dataType ? dataTypeIcons[dataType]?.icon : null

  if (!selectedSourceMarker?.properties?.id) return null
  return (
    <ErrorBoundary errorComponent={() => <></>}>
      <Popup
        key={selectedSourceMarker.properties.id}
        longitude={
          (selectedSourceMarker.geometry as Point)?.coordinates?.[0] || 0
        }
        latitude={(selectedSourceMarker.geometry as Point)?.coordinates[1] || 0}
        closeOnClick={false}
        closeButton={true}
        closeOnMove={true}
        onClose={() => setSelectedSourceMarker(null)}
        anchor="bottom"
        offset={[0, -10] as any}
      >
        <div className="relative z-10 rounded-lg w-48 p-2 bg-[#1f2229]/50  ">
          <div className=" backdrop-blur-[2px] rounded-lg p-4 absolute top-0 left-0 w-full h-full -z-10 border border-meepGray-600"></div>
          {selectedPointLoading ? (
            <div className="font-IBMPlexMono p-2 space-y-1 ">
              <div className="-space-y-1">
                <div className="text-meepGray-400">LOADING</div>
              </div>
            </div>
          ) : (
            <>
              <div className="font-IBMPlexSans p-2 space-y-2 text-white  ">
                {!!selectedPointData?.importedDataGeojsonPoint?.properties
                  ?.name && (
                  <div className="-space-y-1 flex flex-row items-center justify-between">
                    <p className="text-base font-medium">
                      {
                        selectedPointData?.importedDataGeojsonPoint.properties
                          .name
                      }
                    </p>
                    {IconComponent && (
                      <IconComponent className="w-5 h-5 text-meepGray-400" />
                    )}
                  </div>
                )}

                {!!selectedPointData?.importedDataGeojsonPoint?.properties
                  ?.postcodeData?.postcode && (
                  <div className="-space-y-1">
                    <div className="text-meepGray-400 font-IBMPlexMono mb-1">
                      POSTCODE
                    </div>
                    <pre>
                      {
                        selectedPointData?.importedDataGeojsonPoint.properties
                          .postcodeData.postcode
                      }
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Popup>
    </ErrorBoundary>
  )
}

export default MarkerPopup

const GET_DATA_TYPE = gql`
  query ExternalDataSourceInspectPage($ID: ID!) {
    externalDataSource(pk: $ID) {
      id
      name
      dataType
    }
  }
`
