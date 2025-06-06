/*eslint no-unused-vars: "off"*/

import overlap from './layout-algorithms/overlap'
import noOverlap from './layout-algorithms/no-overlap'
import stacked from './layout-algorithms/stacked'

const DefaultAlgorithms = {
  overlap: overlap,
  'no-overlap': noOverlap,
  stacked: stacked,
}

function isFunction(a) {
  return !!(a && a.constructor && a.call && a.apply)
}

//
export function getStyledEvents({
  events,
  minimumStartDifference,
  slotMetrics,
  accessors,
  ignoreSort,
  dayLayoutAlgorithm, // one of DefaultAlgorithms keys
  // or custom function
}) {
  let algorithm = dayLayoutAlgorithm

  if (dayLayoutAlgorithm in DefaultAlgorithms)
    algorithm = DefaultAlgorithms[dayLayoutAlgorithm]

  if (!isFunction(algorithm)) {
    // invalid algorithm
    return []
  }

  return algorithm.apply(this, arguments)
}
