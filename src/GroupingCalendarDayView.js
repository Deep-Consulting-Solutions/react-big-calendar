import React from 'react'

export const GroupingCalendarDayView = ({
  children,
  resource,
  index,
  grouping,
  showGroupingTitle,
}) => {
  return (
    <div className="rbc-week-grouping-wrapper">
      <div className="rbc-grouping-column">
        {index === 0 ? (
          <div className="rbc-header-label-grouping-column rbc-header-label-grouping-column-day">
            {showGroupingTitle && <span>{grouping.title}</span>}
          </div>
        ) : null}
        <div
          className={`rbc-label-container-grouping-column ${
            index === 0
              ? 'rbc-label-container-grouping-column-week-first-facility'
              : ''
          } rbc-label-container-grouping-column-day`}
        >
          <div className="rbc-label-grouping-column">
            <span>{resource.title}</span>
          </div>
        </div>
      </div>
      <div className="rbc-grouping-children-wrapper">{children}</div>
    </div>
  )
}
