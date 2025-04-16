import React from 'react'

export const GroupingCalendarWeekView = ({
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
          <div className="rbc-header-label-grouping-column rbc-header-label-grouping-column-week">
            {showGroupingTitle && <span>{grouping.title}</span>}
          </div>
        ) : null}
        <div className="rbc-label-container-grouping-column">
          <div className="rbc-label-grouping-column">
            <span>{resource.title}</span>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
