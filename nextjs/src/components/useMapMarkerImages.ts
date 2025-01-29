import { DataSourceType } from '@/__generated__/graphql'
import { useLoadedMap, useMapIcons } from '@/lib/map'

const useMapMarkerImages = () => {
  const mapbox = useLoadedMap()
  const requiredImages = [
    {
      url: () =>
        new URL('/markers/default.png', window.location.href).toString(),
      name: 'meep-marker-0',
    },
    {
      url: () =>
        new URL('/markers/default-2.png', window.location.href).toString(),
      name: 'meep-marker-1',
    },
    {
      url: () =>
        new URL('/markers/selected.png', window.location.href).toString(),
      name: 'meep-marker-selected',
    },
    {
      url: () =>
        new URL('/markers/marker-member.png', window.location.href).toString(),
      name: DataSourceType.Member,
    },
    {
      url: () =>
        new URL(
          '/markers/marker-location.png',
          window.location.href
        ).toString(),
      name: DataSourceType.Location,
    },
    {
      url: () =>
        new URL('/markers/marker-group.png', window.location.href).toString(),
      name: DataSourceType.Group,
    },
    {
      url: () =>
        new URL('/markers/marker-event.png', window.location.href).toString(),
      name: DataSourceType.Event,
    },
    {
      url: () =>
        new URL('/markers/marker-other.png', window.location.href).toString(),
      name: DataSourceType.AreaStats,
    },
    {
      url: () =>
        new URL('/markers/marker-other.png', window.location.href).toString(),
      name: DataSourceType.Other,
    },
    {
      url: () =>
        new URL('/markers/marker-story.png', window.location.href).toString(),
      name: DataSourceType.Story,
    },
  ]

  useMapIcons(requiredImages, mapbox)

  return null
}

export default useMapMarkerImages
