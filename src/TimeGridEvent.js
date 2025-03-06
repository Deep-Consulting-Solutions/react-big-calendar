import clsx from 'clsx'
import React from 'react'

function stringifyPercent(v) {
  return typeof v === 'string' ? v : v + '%'
}

/* eslint-disable react/prop-types */
function TimeGridEvent(props) {
  const {
    style,
    className,
    event,
    accessors,
    rtl,
    selected,
    label,
    continuesPrior,
    continuesAfter,
    getters,
    onClick,
    onDoubleClick,
    isBackgroundEvent,
    onKeyPress,
    components: { event: Event, eventWrapper: EventWrapper },
    useRow,
    isDayGrouping,
  } = props
  let title = accessors.title(event)
  let tooltip =
    typeof event.tooltip === 'string' ? event.tooltip : accessors.tooltip(event)
  let end = accessors.end(event)
  let start = accessors.start(event)

  let userProps = getters.eventProp(event, start, end, selected)

  const inner = [
    <div key="1" className="rbc-event-label">
      {label}
    </div>,
    <div key="2" className="rbc-event-content">
      {Event ? <Event event={event} title={title} /> : title}
    </div>,
  ]

  const { height, top, width, xOffset } = style

  const startDate = new Date(event.start)
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes()
  const left = (startMinutes / (24 * 60)) * 100

  const endDate = new Date(event.end)
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes()
  const timeDiff = endMinutes - startMinutes
  const timeDiffPercent = (timeDiff / (24 * 60)) * 100

  const eventStyle = {
    ...userProps.style,
    ...(useRow
      ? {
          top: 0,
          left: stringifyPercent(left),
          width: stringifyPercent(timeDiffPercent),
        }
      : {
          top: stringifyPercent(top),
          height: stringifyPercent(height),
          width: stringifyPercent(width),
          [rtl ? 'right' : 'left']: stringifyPercent(xOffset),
        }),
  }

  return (
    <EventWrapper type="time" {...props}>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        style={eventStyle}
        onKeyDown={onKeyPress}
        title={
          tooltip
            ? (typeof label === 'string' ? label + ': ' : '') + tooltip
            : undefined
        }
        className={clsx(
          isBackgroundEvent ? 'rbc-background-event' : 'rbc-event',
          className,
          userProps.className,
          {
            'rbc-selected': selected,
            'rbc-event-continues-earlier': isDayGrouping
              ? false
              : continuesPrior,
            'rbc-event-continues-later': isDayGrouping ? false : continuesAfter,
          }
        )}
      >
        {inner}
      </div>
    </EventWrapper>
  )
}

export default TimeGridEvent
