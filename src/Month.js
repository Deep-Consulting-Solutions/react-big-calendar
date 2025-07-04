import React, { createRef } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'

import chunk from 'lodash/chunk'

import { navigate, views } from './utils/constants'
import { notify } from './utils/helpers'
import getPosition from 'dom-helpers/position'
import * as animationFrame from 'dom-helpers/animationFrame'

/* import Popup from './Popup'
import Overlay from 'react-overlays/Overlay' */
import PopOverlay from './PopOverlay'
import DateContentRow from './DateContentRow'
import Header from './Header'
import DateHeader from './DateHeader'

import { inRange, sortWeekEvents } from './utils/eventLevels'

let eventsForWeek = (evts, start, end, accessors, localizer) =>
  evts.filter((e) => inRange(e, start, end, accessors, localizer))

class MonthView extends React.Component {
  constructor(...args) {
    super(...args)

    this.state = {
      rowLimit: 5,
      needLimitMeasure: true,
      date: null,
    }
    this.containerRef = createRef()
    this.slotRowRef = createRef()

    this._bgRows = []
    this._pendingSelection = []
  }

  static getDerivedStateFromProps({ date, localizer }, state) {
    return {
      date,
      needLimitMeasure: localizer.neq(date, state.date, 'month'),
    }
  }

  componentDidMount() {
    let running

    if (this.state.needLimitMeasure) this.measureRowLimit(this.props)

    window.addEventListener(
      'resize',
      (this._resizeListener = () => {
        if (!running) {
          animationFrame.request(() => {
            running = false
            this.setState({ needLimitMeasure: true }) //eslint-disable-line
          })
        }
      }),
      false
    )
  }

  componentDidUpdate() {
    if (this.state.needLimitMeasure) this.measureRowLimit(this.props)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._resizeListener, false)
  }

  getContainer = () => {
    return this.containerRef.current
  }

  render() {
    let {
        date,
        localizer,
        className,
        hideHeader,
        isGrouped,
        resourceId,
        resourceTriggeringPopup,
        id,
      } = this.props,
      month = localizer.visibleDays(date, localizer),
      weeks = chunk(month, 7)

    this._weekCount = weeks.length

    return (
      <div
        id={id}
        className={clsx('rbc-month-view', className)}
        role="table"
        aria-label="Month View"
        ref={this.containerRef}
      >
        {hideHeader ? null : (
          <div className="rbc-row rbc-month-header" role="row">
            {this.renderHeaders(weeks[0])}
          </div>
        )}
        {weeks.map(this.renderWeek)}
        {!isGrouped && this.props.popup && this.renderOverlay()}
        {isGrouped &&
          this.props.popup &&
          resourceId === resourceTriggeringPopup &&
          this.renderOverlay()}
      </div>
    )
  }

  renderWeek = (week, weekIdx) => {
    let {
      events,
      components,
      selectable,
      getNow,
      selected,
      date,
      localizer,
      longPressThreshold,
      accessors,
      getters,
      showAllEvents,
      maxRows,
      isPopupOpen,
      isFetchingMoreEvents,
      dateTriggeringShowMore,
      resourceId,
      resourceTriggeringPopup,
      ignoreSort,
    } = this.props

    const { needLimitMeasure, rowLimit } = this.state

    // let's not mutate props
    const weeksEvents = eventsForWeek(
      [...events],
      week[0],
      week[week.length - 1],
      accessors,
      localizer
    )

    const sorted = ignoreSort
      ? weeksEvents
      : sortWeekEvents(weeksEvents, accessors, localizer)

    return (
      <DateContentRow
        key={weekIdx}
        ref={weekIdx === 0 ? this.slotRowRef : undefined}
        container={this.getContainer}
        className="rbc-month-row"
        getNow={getNow}
        date={date}
        range={week}
        events={sorted}
        maxRows={showAllEvents ? Infinity : maxRows || rowLimit}
        selected={selected}
        selectable={selectable}
        components={components}
        accessors={accessors}
        getters={getters}
        localizer={localizer}
        renderHeader={this.readerDateHeading}
        renderForMeasure={needLimitMeasure}
        onShowMore={this.handleShowMore}
        onSelect={this.handleSelectEvent}
        onDoubleClick={this.handleDoubleClickEvent}
        onKeyPress={this.handleKeyPressEvent}
        onSelectSlot={this.handleSelectSlot}
        longPressThreshold={longPressThreshold}
        rtl={this.props.rtl}
        resizable={this.props.resizable}
        showAllEvents={showAllEvents}
        isPopupOpen={isPopupOpen}
        loadingMore={isFetchingMoreEvents}
        dateTriggeringShowMore={dateTriggeringShowMore}
        triggeredLoadingMore={resourceId === resourceTriggeringPopup}
      />
    )
  }

  readerDateHeading = ({ date, className, ...props }) => {
    let { date: currentDate, getDrilldownView, localizer } = this.props
    let isOffRange = localizer.neq(date, currentDate, 'month')
    let isCurrent = localizer.isSameDate(date, currentDate)
    let drilldownView = getDrilldownView(date)
    let label = localizer.format(date, 'dateFormat')
    let DateHeaderComponent = this.props.components.dateHeader || DateHeader

    return (
      <div
        {...props}
        className={clsx(
          className,
          isOffRange && 'rbc-off-range',
          isCurrent && 'rbc-current'
        )}
        role="cell"
      >
        <DateHeaderComponent
          label={label}
          date={date}
          drilldownView={drilldownView}
          isOffRange={isOffRange}
          onDrillDown={(e) => this.handleHeadingClick(date, drilldownView, e)}
        />
      </div>
    )
  }

  renderHeaders(row) {
    let { localizer, components } = this.props
    let first = row[0]
    let last = row[row.length - 1]
    let HeaderComponent = components.header || Header

    return localizer.range(first, last, 'day').map((day, idx) => (
      <div key={'header_' + idx} className="rbc-header">
        <HeaderComponent
          date={day}
          localizer={localizer}
          label={localizer.format(day, 'weekdayFormat')}
        />
      </div>
    ))
  }

  renderOverlay() {
    let {
      accessors,
      localizer,
      components,
      getters,
      selected,
      popupOffset,
      handleDragStart,
      overlay,
      closePopup,
      resourceTitle,
    } = this.props

    return (
      <PopOverlay
        overlay={overlay}
        accessors={accessors}
        localizer={localizer}
        components={components}
        getters={getters}
        selected={selected}
        popupOffset={popupOffset}
        ref={this.containerRef}
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

    /* return (
      <Overlay
        rootClose
        placement="bottom"
        show={!!overlay.position}
        onHide={() => this.setState({ overlay: null })}
        target={() => overlay.target}
      >
        {({ props }) => (
          <Popup
            {...props}
            popupOffset={popupOffset}
            accessors={accessors}
            getters={getters}
            selected={selected}
            components={components}
            localizer={localizer}
            position={overlay.position}
            show={this.overlayDisplay}
            events={overlay.events}
            slotStart={overlay.date}
            slotEnd={overlay.end}
            onSelect={this.handleSelectEvent}
            onDoubleClick={this.handleDoubleClickEvent}
            onKeyPress={this.handleKeyPressEvent}
            handleDragStart={this.props.handleDragStart}
          />
        )}
      </Overlay>
    ) */
  }

  measureRowLimit() {
    this.setState({
      needLimitMeasure: false,
      rowLimit: this.slotRowRef.current.getRowLimit(),
    })
  }

  handleSelectSlot = (range, slotInfo) => {
    this._pendingSelection = this._pendingSelection.concat(range)

    clearTimeout(this._selectTimer)
    this._selectTimer = setTimeout(() => this.selectDates(slotInfo))
  }

  handleHeadingClick = (date, view, e) => {
    e.preventDefault()
    this.clearSelection()
    notify(this.props.onDrillDown, [date, view])
  }

  handleSelectEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onSelectEvent, args)
  }

  handleDoubleClickEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onDoubleClickEvent, args)
  }

  handleKeyPressEvent = (...args) => {
    this.clearSelection()
    notify(this.props.onKeyPressEvent, args)
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
    //cancel any pending selections so only the event click goes through.
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
        isFetchingMoreEvents: false,
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

  overlayDisplay = () => {
    this.props.closePopup()
  }

  selectDates(slotInfo) {
    let slots = this._pendingSelection.slice()

    this._pendingSelection = []

    slots.sort((a, b) => +a - +b)

    const start = new Date(slots[0])
    const end = new Date(slots[slots.length - 1])
    end.setDate(slots[slots.length - 1].getDate() + 1)

    notify(this.props.onSelectSlot, {
      slots,
      start,
      end,
      action: slotInfo.action,
      bounds: slotInfo.bounds,
      box: slotInfo.box,
    })
  }

  clearSelection() {
    clearTimeout(this._selectTimer)
    this._pendingSelection = []
  }
}

MonthView.propTypes = {
  events: PropTypes.array.isRequired,
  date: PropTypes.instanceOf(Date),

  min: PropTypes.instanceOf(Date),
  max: PropTypes.instanceOf(Date),

  step: PropTypes.number,
  getNow: PropTypes.func.isRequired,

  resourceTitle: PropTypes.string,
  maxRows: PropTypes.number,
  isPopupOpen: PropTypes.bool,
  overlay: PropTypes.object,

  scrollToTime: PropTypes.instanceOf(Date),
  enableAutoScroll: PropTypes.bool,
  rtl: PropTypes.bool,
  resizable: PropTypes.bool,
  width: PropTypes.number,

  accessors: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object.isRequired,
  localizer: PropTypes.object.isRequired,

  selected: PropTypes.object,
  selectable: PropTypes.oneOf([true, false, 'ignoreEvents']),
  longPressThreshold: PropTypes.number,

  onNavigate: PropTypes.func,
  onSelectSlot: PropTypes.func,
  onSelectEvent: PropTypes.func,
  onDoubleClickEvent: PropTypes.func,
  onKeyPressEvent: PropTypes.func,
  onShowMore: PropTypes.func,
  showAllEvents: PropTypes.bool,
  doShowMoreDrillDown: PropTypes.bool,
  onDrillDown: PropTypes.func,
  getDrilldownView: PropTypes.func.isRequired,
  closePopup: PropTypes.func,
  openPopup: PropTypes.func,

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

  hideHeader: PropTypes.bool,
}

MonthView.range = (date, { localizer }) => {
  let start = localizer.firstVisibleDay(date, localizer)
  let end = localizer.lastVisibleDay(date, localizer)
  return { start, end }
}

MonthView.navigate = (date, action, { localizer }) => {
  switch (action) {
    case navigate.PREVIOUS:
      return localizer.add(date, -1, 'month')

    case navigate.NEXT:
      return localizer.add(date, 1, 'month')

    default:
      return date
  }
}

MonthView.title = (date, { localizer }) =>
  localizer.format(date, 'monthHeaderFormat')

export default MonthView
