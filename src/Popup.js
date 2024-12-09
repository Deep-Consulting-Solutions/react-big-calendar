import React, { useLayoutEffect } from 'react'
import PropTypes from 'prop-types'
import getOffset from 'dom-helpers/offset'

import useClickOutside from './hooks/useClickOutside'
import EventCell from './EventCell'
import { isSelected } from './utils/selection'

/**
 * Changes to react-overlays cause issue with auto positioning,
 * so we need to manually calculate the position of the popper,
 * and constrain it to the Month container.
 */
function getPosition({ target, offset, container, box }) {
  const { top, left, width, height } = getOffset(target)
  const {
    top: cTop,
    left: cLeft,
    width: cWidth,
    height: cHeight,
  } = getOffset(container)
  const { width: bWidth, height: bHeight } = getOffset(box)
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  const { x, y } = offset

  // Minimum gap between popup and triggering element
  const GAP = 2

  // Calculate potential top and bottom positions
  const topPosition = top - bHeight - y - GAP
  const bottomPosition = top + height + y + GAP

  // Determine final topOffset
  let topOffset =
    bottomPosition + bHeight <= viewportHeight
      ? bottomPosition
      : topPosition >= 0
      ? topPosition
      : Math.max(bottomPosition, 0) // Ensure it's at least visible

  // Constrain to container's vertical boundaries
  const containerBottom = cTop + cHeight
  if (topOffset + bHeight > containerBottom) {
    topOffset = containerBottom - bHeight
  } else if (topOffset < cTop) {
    topOffset = cTop
  }

  // Calculate potential left and right positions
  const leftPosition = left + x
  const rightPosition = left + x - bWidth + width

  // Determine final leftOffset
  let leftOffset =
    leftPosition + bWidth <= viewportWidth
      ? leftPosition
      : rightPosition >= 0
      ? rightPosition
      : Math.max(leftPosition, 0) // Ensure it's at least visible

  // Constrain to container's horizontal boundaries
  const containerRight = cLeft + cWidth
  if (leftOffset + bWidth > containerRight) {
    leftOffset = containerRight - bWidth
  } else if (leftOffset < cLeft) {
    leftOffset = cLeft
  }

  // Ensure the popup doesn't cover the target when constrained
  if (
    topOffset < top + height + GAP &&
    topOffset + bHeight > top - GAP &&
    leftOffset < left + width &&
    leftOffset + bWidth > left
  ) {
    // If overlapping, shift popup slightly to avoid covering the target
    if (topPosition >= 0) {
      topOffset = topPosition
    } else {
      topOffset = bottomPosition
    }
  }

  return {
    topOffset,
    leftOffset,
  }
}

function Pop({
  containerRef,
  accessors,
  getters,
  selected,
  components,
  localizer,
  position,
  show,
  events,
  slotStart,
  slotEnd,
  onSelect,
  onDoubleClick,
  onKeyPress,
  handleDragStart,
  popperRef,
  target,
  offset,
}) {
  useClickOutside({ ref: popperRef, callback: show })
  useLayoutEffect(() => {
    const { topOffset, leftOffset } = getPosition({
      target,
      offset,
      container: containerRef.current,
      box: popperRef.current,
    })
    popperRef.current.style.top = `${topOffset}px`
    popperRef.current.style.left = `${leftOffset}px`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset.x, offset.y, target])

  const { width } = position
  const style = {
    minWidth: width + width / 2,
  }
  return (
    <div style={style} className="rbc-overlay" ref={popperRef}>
      <div className="rbc-overlay-header">
        {localizer.format(slotStart, 'dayHeaderFormat')}
      </div>
      {events.map((event, idx) => (
        <EventCell
          key={idx}
          type="popup"
          localizer={localizer}
          event={event}
          getters={getters}
          onSelect={onSelect}
          accessors={accessors}
          components={components}
          onDoubleClick={onDoubleClick}
          onKeyPress={onKeyPress}
          continuesPrior={localizer.lt(accessors.end(event), slotStart, 'day')}
          continuesAfter={localizer.gte(accessors.start(event), slotEnd, 'day')}
          slotStart={slotStart}
          slotEnd={slotEnd}
          selected={isSelected(event, selected)}
          draggable={true}
          onDragStart={() => handleDragStart(event)}
          onDragEnd={() => show()}
        />
      ))}
    </div>
  )
}

const Popup = React.forwardRef((props, ref) => (
  <Pop {...props} popperRef={ref} />
))
Popup.propTypes = {
  accessors: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  selected: PropTypes.object,
  components: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,
  position: PropTypes.object.isRequired,
  show: PropTypes.func.isRequired,
  events: PropTypes.array.isRequired,
  slotStart: PropTypes.instanceOf(Date).isRequired,
  slotEnd: PropTypes.instanceOf(Date),
  onSelect: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onKeyPress: PropTypes.func,
  handleDragStart: PropTypes.func,
  style: PropTypes.object,
  offset: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
}
export default Popup
