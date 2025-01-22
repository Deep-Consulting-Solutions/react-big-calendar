import PropTypes from 'prop-types'
import clsx from 'clsx'
import scrollbarSize from 'dom-helpers/scrollbarSize'
import React from 'react'

import DateContentRow from './DateContentRow'
import Header from './Header'
import ResourceHeader from './ResourceHeader'
import { notify } from './utils/helpers'

class TimeGridHeader extends React.Component {
  handleHeaderClick = (date, view, e) => {
    e.preventDefault()
    notify(this.props.onDrillDown, [date, view])
  }

  renderHeaderCells(range) {
    let {
      localizer,
      getDrilldownView,
      getNow,
      getters: { dayProp },
      components: { header: HeaderComponent = Header },
    } = this.props

    const today = getNow()

    return range.map((date, i) => {
      let drilldownView = getDrilldownView(date)
      let label = localizer.format(date, 'dayFormat')

      const { className, style } = dayProp(date)

      let header = (
        <HeaderComponent date={date} label={label} localizer={localizer} />
      )

      return (
        <div
          key={i}
          style={style}
          className={clsx(
            'rbc-header',
            className,
            localizer.isSameDate(date, today) && 'rbc-today'
          )}
        >
          {drilldownView ? (
            <button
              type="button"
              className="rbc-button-link"
              onClick={(e) => this.handleHeaderClick(date, drilldownView, e)}
            >
              {header}
            </button>
          ) : (
            <span>{header}</span>
          )}
        </div>
      )
    })
  }
  renderRow = (resource) => {
    let {
      events,
      rtl,
      selectable,
      getNow,
      range,
      getters,
      localizer,
      accessors,
      components,
      resizable,
      maxRows,
      loadingMore,
      dateTriggeringShowMore,
      isPopupOpen,
      isGrouped,
    } = this.props

    const resourceId = accessors.resourceId(resource)
    let eventsToDisplay = resource
      ? events.filter((event) => accessors.resource(event) === resourceId)
      : events

    return (
      <DateContentRow
        isAllDay
        rtl={rtl}
        getNow={getNow}
        minRows={2}
        // Add +1 to include showMore button row in the row limit
        maxRows={maxRows || this.props.allDayMaxRows + 1}
        range={range}
        events={eventsToDisplay}
        resourceId={resourceId}
        className={clsx('rbc-allday-cell', isGrouped && 'rbc-allday-cell-alt')}
        selectable={selectable}
        selected={this.props.selected}
        components={components}
        accessors={accessors}
        getters={getters}
        localizer={localizer}
        onSelect={this.props.onSelectEvent}
        onShowMore={this.props.onShowMore}
        onDoubleClick={this.props.onDoubleClickEvent}
        onKeyPress={this.props.onKeyPressEvent}
        onSelectSlot={this.props.onSelectSlot}
        longPressThreshold={this.props.longPressThreshold}
        resizable={resizable}
        loadingMore={loadingMore}
        dateTriggeringShowMore={dateTriggeringShowMore}
        isPopupOpen={isPopupOpen}
      />
    )
  }

  render() {
    let {
      width,
      rtl,
      resources,
      range,
      events,
      getNow,
      accessors,
      selectable,
      components,
      getters,
      scrollRef,
      localizer,
      isOverflowing,
      maxRows,
      loadingMore,
      isGrouped,
      dateTriggeringShowMore,
      components: {
        timeGutterHeader: TimeGutterHeader,
        resourceHeader: ResourceHeaderComponent = ResourceHeader,
      },
      resizable,
      isPopupOpen,
    } = this.props

    let style = {}
    if (isOverflowing) {
      style[rtl ? 'marginLeft' : 'marginRight'] = `${scrollbarSize() - 1}px`
    }

    const groupedEvents = resources.groupEvents(events)

    return (
      <div
        style={style}
        ref={scrollRef}
        className={clsx('rbc-time-header', isOverflowing && 'rbc-overflowing')}
      >
        {this.props.hideGutter ? null : (
          <div
            className="rbc-label rbc-time-header-gutter"
            style={{ width, minWidth: width, maxWidth: width }}
          >
            {TimeGutterHeader && <TimeGutterHeader />}
          </div>
        )}

        {resources.map(([id, resource], idx) => (
          <div className="rbc-time-header-content" key={id || idx}>
            {resource && (
              <div className="rbc-row rbc-row-resource" key={`resource_${idx}`}>
                <div className="rbc-header">
                  <ResourceHeaderComponent
                    index={idx}
                    label={accessors.resourceTitle(resource)}
                    resource={resource}
                  />
                </div>
              </div>
            )}
            {this.props.hideHeader ? null : (
              <div
                className={`rbc-row rbc-time-header-cell${
                  range.length <= 1 ? ' rbc-time-header-cell-single-day' : ''
                }`}
              >
                {this.renderHeaderCells(range)}
              </div>
            )}
            <DateContentRow
              isAllDay
              rtl={rtl}
              getNow={getNow}
              minRows={2}
              // Add +1 to include showMore button row in the row limit
              maxRows={maxRows || this.props.allDayMaxRows + 1}
              range={range}
              events={groupedEvents.get(id) || []}
              resourceId={resource && id}
              className={clsx(
                'rbc-allday-cell',
                isGrouped && 'rbc-allday-cell-alt'
              )}
              selectable={selectable}
              selected={this.props.selected}
              components={components}
              accessors={accessors}
              getters={getters}
              localizer={localizer}
              onSelect={this.props.onSelectEvent}
              onShowMore={this.props.onShowMore}
              onDoubleClick={this.props.onDoubleClickEvent}
              onKeyDown={this.props.onKeyPressEvent}
              onSelectSlot={this.props.onSelectSlot}
              longPressThreshold={this.props.longPressThreshold}
              resizable={resizable}
              loadingMore={loadingMore}
              dateTriggeringShowMore={dateTriggeringShowMore}
              isPopupOpen={isPopupOpen}
            />
          </div>
        ))}
      </div>
    )
  }
}

TimeGridHeader.propTypes = {
  range: PropTypes.array.isRequired,
  events: PropTypes.array.isRequired,
  resources: PropTypes.object,
  getNow: PropTypes.func.isRequired,
  isOverflowing: PropTypes.bool,

  rtl: PropTypes.bool,
  resizable: PropTypes.bool,
  width: PropTypes.number,

  localizer: PropTypes.object.isRequired,
  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,

  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,

  allDayMaxRows: PropTypes.number,
  maxRows: PropTypes.number,
  isGrouped: PropTypes.bool,
  isPopupOpen: PropTypes.bool,
  loadingMore: PropTypes.bool,
  dateTriggeringShowMore: PropTypes.instanceOf(Date),

  onSelectSlot: PropTypes.func,
  onSelectEvent: PropTypes.func,
  onDoubleClickEvent: PropTypes.func,
  onKeyPressEvent: PropTypes.func,
  onDrillDown: PropTypes.func,
  onShowMore: PropTypes.func,
  getDrilldownView: PropTypes.func.isRequired,
  scrollRef: PropTypes.any,
  hideHeader: PropTypes.bool,
  hideGutter: PropTypes.bool,
}

export default TimeGridHeader
