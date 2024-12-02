import { scaleLinear, scaleSequential } from 'd3-scale'
import { interpolateInferno } from 'd3-scale-chromatic'
import { FillLayerSpecification } from 'mapbox-gl'

export function getChoroplethPaintObject(tileset: {
  data: any[]
}): FillLayerSpecification['paint'] {
  let min =
    tileset.data.reduce(
      (min, p) => (p?.count! < min ? p?.count! : min),
      tileset.data?.[0]?.count!
    ) || 0
  let max =
    tileset.data.reduce(
      (max, p) => (p?.count! > max ? p?.count! : max),
      tileset.data?.[0]?.count!
    ) || 1

  // Ensure min and max are different to fix interpolation errors
  if (min === max) {
    if (min >= 1) {
      min = min - 1
    } else {
      max = max + 1
    }
  }

  // Uses 0-1 for easy interpolation
  // go from 0-100% and return real numbers
  const legendScale = scaleLinear().domain([0, 1]).range([min, max])

  // Map real numbers to colours
  const colourScale = scaleSequential()
    .domain([min, max])
    .interpolator(interpolateInferno)

  let steps = Math.min(max, 30) // Max 30 steps
  steps = Math.max(steps, 3) // Min 3 steps (for valid Mapbox fill-color rule)
  const colourStops = new Array(steps)
    .fill(0)
    .map((_, i) => i / steps)
    .map((n) => {
      return [legendScale(n), colourScale(legendScale(n))]
    })
    .flat()

  return {
    // Shade the map by the count of imported data
    'fill-color': [
      'interpolate',
      ['linear'],
      ['to-number', ['feature-state', 'count'], 0],
      ...colourStops,
    ],
    'fill-opacity': 0.8,
  }
}
