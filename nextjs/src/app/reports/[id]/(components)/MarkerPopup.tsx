import { useQuery } from '@apollo/client'
import { Point } from 'geojson'
import { useAtom } from 'jotai'
import { ErrorBoundary } from 'next/dist/client/components/error-boundary'
import React from 'react'
import { Popup } from 'react-map-gl'

import {
  MapReportLayerGeoJsonPointQuery,
  MapReportLayerGeoJsonPointQueryVariables,
} from '@/__generated__/graphql'
import { selectedSourceMarkerAtom } from '@/lib/map'

import { UserIcon } from 'lucide-react'
import { MAP_REPORT_LAYER_POINT } from '../gql_queries'
import useMarkerAnalytics from '../useMarkerAnalytics'

const MarkerPopup: React.FC = () => {
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
        className="
        [&>.mapboxgl-popup-tip]:!border-t-transparent 
          [&>.mapboxgl-popup-content]:p-2 
          [&>.mapboxgl-popup-content]:overflow-auto 
          [&>.mapboxgl-popup-content]:w-[150px] 
          [&>.mapboxgl-popup-content]:!bg-meepGray-800 
          [&>.mapboxgl-popup-content]:!border 
          [&>.mapboxgl-popup-content]:!shadow-md
          [&>.mapboxgl-popup-content]:!rounded-[4px]
          "
        closeButton={true}
        closeOnMove={true}
        onClose={() => setSelectedSourceMarker(null)}
        anchor="bottom"
        offset={[0, -10] as any}
      >
        {selectedPointLoading ? (
          <div className="font-IBMPlexMono p-2 space-y-1">
            <div className="-space-y-1">
              <div className="text-meepGray-400">LOADING</div>
            </div>
          </div>
        ) : (
          <>
            <div className="font-IBMPlexSans p-2 space-y-2 bg-meepGray-800 text-white">
              {!!selectedPointData?.importedDataGeojsonPoint?.properties
                ?.name && (
                <div className="-space-y-1 flex flex-row items-center justify-between">
                  <p className="text-base font-medium">
                    {
                      selectedPointData?.importedDataGeojsonPoint.properties
                        .name
                    }
                  </p>
                  <UserIcon className="w-5 h-5 stroke-meepGray-200 stroke-1" />
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
      </Popup>
    </ErrorBoundary>
  )
}

export default MarkerPopup
