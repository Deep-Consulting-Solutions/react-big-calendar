import React, { Component, createRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import * as animationFrame from 'dom-helpers/animationFrame'
import memoize from 'memoize-one'

import DayColumn from './DayColumn'
import TimeGutter from './TimeGutter'
import TimeGridHeader from './TimeGridHeader'
import PopOverlay from './PopOverlay'

import getWidth from 'dom-helpers/width'
import getPosition from 'dom-helpers/position'
import { views } from './utils/constants'
import { inRange, sortEvents, sortWeekEvents } from './utils/eventLevels'
import { notify } from './utils/helpers'
import Resources from './utils/Resources'
import { DayLayoutAlgorithmPropType } from './utils/propTypes'

export default class TimeGrid extends Component {
  constructor(props) {
    super(props)

    this.state = { gutterWidth: undefined, isOverflowing: null }

    this.scrollRef = React.createRef()
    this.contentRef = React.createRef()
    this.containerRef = React.createRef()
    this._scrollRatio = null
    this.gutterRef = createRef()
  }

  getSnapshotBeforeUpdate() {
    this.checkOverflow()
    return null
  }

  componentDidMount() {
    if (this.props.width == null) {
      this.measureGutter()
    }

    this.calculateScroll()
    this.applyScroll()

    window.addEventListener('resize', this.handleResize)
  }

  handleScroll = (e) => {
    if (this.scrollRef.current) {
      this.scrollRef.current.scrollLeft = e.target.scrollLeft
    }
  }

  handleResize = () => {
    animationFrame.cancel(this.rafHandle)
    this.rafHandle = animationFrame.request(this.checkOverflow)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)

    animationFrame.cancel(this.rafHandle)

    if (this.measureGutterAnimationFrameRequest) {
      window.cancelAnimationFrame(this.measureGutterAnimationFrameRequest)
    }
  }

  componentDidUpdate() {
    this.applyScroll()
  }

  handleKeyPressEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onKeyPressEvent, args)
  }

  handleSelectEvent = (...args) => {
    //cancel any pending selections so only the event click goes through.
    this.clearSelection()
    notify(this.props.onSelectEvent, args)
  }

  handleDoubleClickEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onDoubleClickEvent, args)
  }

  handleShowMore = async (evts, date, cell, slot, target) => {
    const {
      popup,
      onDrillDown,
      onShowMore,
      getDrilldownView,
      doShowMoreDrillDown,
      openPopup,
      resourceId,
      getMoreEvents,
      setFetchingMoreEvents,
    } = this.props
    this.clearSelection()

    let events

    try {
      if (getMoreEvents) {
        setFetchingMoreEvents({
          isFetchingMoreEvents: true,
          dateTriggeringShowMore: date,
          resourceTriggeringPopup: resourceId,
        })
        events = await getMoreEvents(date, resourceId)
      } else {
        events = evts
      }
    } catch (error) {
      console.error('Error fetching more events:', error)
      events = evts
    } finally {
      setFetchingMoreEvents({
        isFetchingMoreEvents: true,
        dateTriggeringShowMore: null,
      })
    }

    if (popup) {
      let position = getPosition(cell, this.containerRef.current)

      openPopup({ date, events, position, target, resourceId })
    } else if (doShowMoreDrillDown) {
      notify(onDrillDown, [date, getDrilldownView(date) || views.DAY])
    }

    notify(onShowMore, [events, date, slot])
  }

  handleSelectAllDaySlot = (slots, slotInfo) => {
    const { onSelectSlot } = this.props

    const start = new Date(slots[0])
    const end = new Date(slots[slots.length - 1])
    end.setDate(slots[slots.length - 1].getDate() + 1)

    notify(onSelectSlot, {
      slots,
      start,
      end,
      action: slotInfo.action,
      resourceId: slotInfo.resourceId,
    })
  }

  renderEvents(range, events, backgroundEvents, now) {
    let { min, max, components, accessors, localizer, dayLayoutAlgorithm } =
      this.props

    const resources = this.memoizedResources(this.props.resources, accessors)
    const groupedEvents = resources.groupEvents(events)
    const groupedBackgroundEvents = resources.groupEvents(backgroundEvents)

    return resources.map(([id, resource], i) =>
      range.map((date, jj) => {
        let daysEvents = (groupedEvents.get(id) || []).filter((event) =>
          localizer.inRange(
            date,
            accessors.start(event),
            accessors.end(event),
            'day'
          )
        )

        let daysBackgroundEvents = (
          groupedBackgroundEvents.get(id) || []
        ).filter((event) =>
          localizer.inRange(
            date,
            accessors.start(event),
            accessors.end(event),
            'day'
          )
        )

        return (
          <DayColumn
            {...this.props}
            localizer={localizer}
            min={localizer.merge(date, min)}
            max={localizer.merge(date, max)}
            resource={resource && id}
            components={components}
            isNow={localizer.isSameDate(date, now)}
            key={i + '-' + jj}
            date={date}
            events={daysEvents}
            backgroundEvents={daysBackgroundEvents}
            dayLayoutAlgorithm={dayLayoutAlgorithm}
            useRow={this.props.isDayGrouping}
          />
        )
      })
    )
  }

  render() {
    let {
      events,
      backgroundEvents,
      range,
      width,
      rtl,
      selected,
      getNow,
      resources,
      components,
      accessors,
      getters,
      localizer,
      min,
      max,
      showMultiDayTimes,
      longPressThreshold,
      resizable,
      maxRows,
      isGrouped,
      resourceId,
      resourceTriggeringPopup,
      isFetchingMoreEvents,
      dateTriggeringShowMore,
      isPopupOpen,
      ignoreSort,
      id,
    } = this.props

    width = width || this.state.gutterWidth

    let start = range[0],
      end = range[range.length - 1]

    this.slots = range.length

    const rangeEventsAlt = events.filter((e) =>
      inRange(e, start, end, accessors, localizer)
    )
    const rangeBackgroundEventsAlt = backgroundEvents.filter((e) =>
      inRange(e, start, end, accessors, localizer)
    )
    const rangeEvents = ignoreSort
      ? rangeEventsAlt
      : sortWeekEvents(rangeEventsAlt, accessors, localizer)
    const rangeBackgroundEvents = ignoreSort
      ? rangeBackgroundEventsAlt
      : sortWeekEvents(rangeBackgroundEventsAlt, accessors, localizer)
    let allDayEvents = []

    events.forEach((event) => {
      if (inRange(event, start, end, accessors, localizer)) {
        let eStart = accessors.start(event),
          eEnd = accessors.end(event)

        if (
          accessors.allDay(event) ||
          localizer.startAndEndAreDateOnly(eStart, eEnd) ||
          (!showMultiDayTimes && !localizer.isSameDate(eStart, eEnd))
        ) {
          allDayEvents.push(event)
        }
      }
    })

    allDayEvents.sort((a, b) => sortEvents(a, b, accessors, localizer))

    return (
      <div
        id={id}
        className={clsx(
          'rbc-time-view',
          resources && 'rbc-time-view-resources',
          !this.props.isDayGrouping && 'rbc-time-view-week',
          this.props.isDayGrouping && 'rbc-time-view-day',
          this.props.isDayGrouping &&
            this.props.isDayGroupingFirst &&
            'rbc-time-view-day-first'
        )}
        ref={this.containerRef}
      >
        {this.props.isDayGrouping ? null : (
          <TimeGridHeader
            range={range}
            events={this.props.isWeekGrouping ? rangeEvents : allDayEvents}
            width={width}
            rtl={rtl}
            getNow={getNow}
            localizer={localizer}
            selected={selected}
            allDayMaxRows={
              this.props.showAllEvents
                ? Infinity
                : this.props.allDayMaxRows ?? Infinity
            }
            maxRows={maxRows}
            resources={this.memoizedResources(resources, accessors)}
            selectable={this.props.selectable}
            accessors={accessors}
            getters={getters}
            components={components}
            scrollRef={this.scrollRef}
            isOverflowing={this.state.isOverflowing}
            longPressThreshold={longPressThreshold}
            onSelectSlot={this.handleSelectAllDaySlot}
            onSelectEvent={this.handleSelectEvent}
            onShowMore={this.handleShowMore}
            onDoubleClickEvent={this.props.onDoubleClickEvent}
            onKeyPressEvent={this.props.onKeyPressEvent}
            onDrillDown={this.props.onDrillDown}
            getDrilldownView={this.props.getDrilldownView}
            resizable={resizable}
            hideHeader={this.props.hideHeader}
            hideGutter={this.props.isWeekGrouping}
            loadingMore={isFetchingMoreEvents}
            dateTriggeringShowMore={dateTriggeringShowMore}
            triggeredLoadingMore={resourceId === resourceTriggeringPopup}
            isPopupOpen={isPopupOpen}
            isGrouped={isGrouped}
          />
        )}
        {!isGrouped && this.props.popup && this.renderOverlay()}
        {isGrouped &&
          this.props.popup &&
          resourceId === resourceTriggeringPopup &&
          this.renderOverlay()}
        <div
          ref={this.contentRef}
          className={clsx(
            'rbc-time-content',
            this.props.isDayGrouping && 'rbc-time-content-day-grouping',
            isGrouped && 'rbc-time-content-alt'
          )}
          onScroll={this.handleScroll}
        >
          {this.props.isWeekGrouping ? null : (
            <>
              {this.props.hideTimeSlots ? null : (
                <TimeGutter
                  date={start}
                  ref={this.gutterRef}
                  localizer={localizer}
                  min={localizer.merge(start, min)}
                  max={localizer.merge(start, max)}
                  step={this.props.step}
                  getNow={this.props.getNow}
                  timeslots={this.props.timeslots}
                  components={components}
                  className="rbc-time-gutter"
                  getters={getters}
                  useRow={this.props.isDayGrouping}
                />
              )}
              {this.renderEvents(
                range,
                rangeEvents,
                rangeBackgroundEvents,
                getNow()
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  renderOverlay() {
    let {
      overlay,
      closePopup,
      accessors,
      localizer,
      components,
      getters,
      selected,
      popupOffset,
      handleDragStart,
      resourceTitle,
      popupContainerRef,
    } = this.props

    // Determine container ref: use override if provided and mounted, else default to this.containerRef
    const containerRef =
      popupContainerRef && popupContainerRef.current
        ? popupContainerRef
        : this.containerRef
    return (
      <PopOverlay
        overlay={overlay}
        accessors={accessors}
        localizer={localizer}
        components={components}
        getters={getters}
        selected={selected}
        popupOffset={popupOffset}
        ref={containerRef}
        handleKeyPressEvent={this.handleKeyPressEvent}
        handleSelectEvent={this.handleSelectEvent}
        handleDoubleClickEvent={this.handleDoubleClickEvent}
        handleDragStart={handleDragStart}
        show={!!overlay.position}
        overlayDisplay={this.overlayDisplay}
        onHide={closePopup}
        resourceTitle={resourceTitle}
      />
    )
  }

  overlayDisplay = () => {
    this.props.closePopup()
  }

  clearSelection() {
    clearTimeout(this._selectTimer)
    this._pendingSelection = []
  }

  measureGutter() {
    if (this.measureGutterAnimationFrameRequest) {
      window.cancelAnimationFrame(this.measureGutterAnimationFrameRequest)
    }
    this.measureGutterAnimationFrameRequest = window.requestAnimationFrame(
      () => {
        const width = this.gutterRef?.current
          ? getWidth(this.gutterRef.current)
          : undefined

        if (width && this.state.gutterWidth !== width) {
          this.setState({ gutterWidth: width })
        }
      }
    )
  }

  applyScroll() {
    // If auto-scroll is disabled, we don't actually apply the scroll
    if (this._scrollRatio != null && this.props.enableAutoScroll === true) {
      const content = this.contentRef.current
      content.scrollTop = content.scrollHeight * this._scrollRatio
      // Only do this once
      this._scrollRatio = null
    }
  }

  calculateScroll(props = this.props) {
    const { min, max, scrollToTime, localizer } = props

    const diffMillis = localizer.diff(
      localizer.merge(scrollToTime, min),
      scrollToTime,
      'milliseconds'
    )
    const totalMillis = localizer.diff(min, max, 'milliseconds')

    this._scrollRatio = diffMillis / totalMillis
  }

  checkOverflow = () => {
    if (this._updatingOverflow) return

    const content = this.contentRef.current

    if (!content?.scrollHeight) return
    let isOverflowing = content.scrollHeight > content.clientHeight

    if (this.state.isOverflowing !== isOverflowing) {
      this._updatingOverflow = true
      this.setState({ isOverflowing }, () => {
        this._updatingOverflow = false
      })
    }
  }

  memoizedResources = memoize((resources, accessors) =>
    Resources(resources, accessors)
  )
}

TimeGrid.propTypes = {
  events: PropTypes.array.isRequired,
  backgroundEvents: PropTypes.array.isRequired,
  resources: PropTypes.array,

  step: PropTypes.number,
  timeslots: PropTypes.number,
  range: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  min: PropTypes.instanceOf(Date).isRequired,
  max: PropTypes.instanceOf(Date).isRequired,
  getNow: PropTypes.func.isRequired,

  scrollToTime: PropTypes.instanceOf(Date).isRequired,
  enableAutoScroll: PropTypes.bool,
  showMultiDayTimes: PropTypes.bool,

  rtl: PropTypes.bool,
  resizable: PropTypes.bool,
  width: PropTypes.number,

  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,

  resourceTitle: PropTypes.string,
  allDayMaxRows: PropTypes.number,
  maxRows: PropTypes.number,
  isPopupOpen: PropTypes.bool,

  isGrouped: PropTypes.bool,
  resourceId: PropTypes.string,
  resourceTriggeringPopup: PropTypes.string,
  isFetchingMoreEvents: PropTypes.bool,

  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,

  onNavigate: PropTypes.func,
  onSelectSlot: PropTypes.func,
  onSelectEnd: PropTypes.func,
  onSelectStart: PropTypes.func,
  onSelectEvent: PropTypes.func,
  onShowMore: PropTypes.func,
  onDoubleClickEvent: PropTypes.func,
  onKeyPressEvent: PropTypes.func,
  onDrillDown: PropTypes.func,
  getDrilldownView: PropTypes.func.isRequired,

  dayLayoutAlgorithm: DayLayoutAlgorithmPropType,

  showAllEvents: PropTypes.bool,
  doShowMoreDrillDown: PropTypes.bool,

  ignoreSort: PropTypes.bool,
  popup: PropTypes.bool,
  handleDragStart: PropTypes.func,

  popupOffset: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
    }),
  ]),
  isWeekGrouping: PropTypes.bool,
  hideHeader: PropTypes.bool,
  isDayGrouping: PropTypes.bool,
  hideTimeSlots: PropTypes.bool,
  isDayGroupingFirst: PropTypes.bool,
  popupContainerRef: PropTypes.shape({ current: PropTypes.any }),
}

TimeGrid.defaultProps = {
  step: 30,
  timeslots: 2,
  isWeekGrouping: false,
  isDayGrouping: false,
  hideHeader: false,
}
