import React, { useMemo } from 'react'
import moment from 'moment'
import { Box, Chip, Typography } from '@mui/material'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import { Calendar, Views, momentLocalizer } from '../../src'
import mdx from './grouping.mdx'
import { shifts, grouping } from '../../data'

const mLocalizer = momentLocalizer(moment)

export function formatEvent(event) {
  const { status, shiftNumber, numberOfApplicants, tooltip } = event

  const title = (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        minHeight: '24px',
      }}
    >
      <span style={{ fontWeight: 'bold', marginRight: '4px' }}>
        {shiftNumber}
      </span>
      <span
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flexGrow: 1,
        }}
      >
        {tooltip}
      </span>
      {status === 'Open' && !!numberOfApplicants && (
        <Chip
          icon={
            <PersonSearchIcon
              fontSize="small"
              sx={{ color: 'white !important', fontSize: '16px' }}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {numberOfApplicants}
            </Typography>
          }
          sx={{
            borderRadius: '4px',
            height: '22px',
            backgroundColor: '#0069AE',
            color: 'white',
          }}
        />
      )}
    </Box>
  )

  return {
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
    title,
  }
}

export default {
  title: 'props',
  component: Calendar,
  argTypes: {
    localizer: { control: { type: null } },
    events: { control: { type: null } },
    defaultDate: {
      control: {
        type: null,
      },
    },
    defaultView: {
      control: {
        type: null,
      },
    },
  },
  parameters: {
    docs: {
      page: mdx,
    },
  },
}

const getMoreEvents = (date) => {
  console.log({ date })
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(shifts.map((shift) => formatEvent(shift)))
    }, 5000)
  })
}

const events = shifts.map((shift) => formatEvent(shift))

const Template = (args) => {
  const [view, setView] = React.useState(Views.MONTH)
  const { components } = useMemo(() => {
    const getDayStyle = (status, style) => ({
      background: status?.bgColor || '',
      color: status?.color,
      top: 5,
      left: `${style?.top || 0}%`,
      width: `${style?.height || 100}%`,
    })

    const getNewStyle = (status, numberOfApplicants) => ({
      background: status?.bgColor,
      color: status?.color,
      marginBottom: '1.5px',
      ...(status?.label === 'Open' && numberOfApplicants > 0
        ? { border: '1px solid #0069AE' }
        : {}),
      ...(status?.label === 'Expired' ? { border: '1px solid #F4674D' } : {}),
    })

    return {
      components: {
        eventWrapper: (eventWrapperProps) => {
          const { event, children, style } = eventWrapperProps
          const status = event.statusObj
          const numberOfApplicants = event.numberOfApplicants || 0

          const appliedStyle =
            view === Views.DAY
              ? getDayStyle(status, style)
              : getNewStyle(status, numberOfApplicants)

          // Clone and return the child with updated styles
          return React.cloneElement(React.Children.only(children), {
            style: appliedStyle,
          })
        },
      },
    }
  }, [view])

  return (
    <div
      style={{
        height: 750 * grouping.resources.length,
      }}
    >
      <Calendar
        {...args}
        view={view}
        onView={(v) => {
          console.log('onView', v)
          setView(v)
        }}
        components={components}
      />
    </div>
  )
}

export const Grouping = Template.bind({})
Grouping.storyName = 'grouping'
Grouping.args = {
  events,
  localizer: mLocalizer,
  grouping,
  onSelectSlot: (...args) => {
    console.log('onSelectSlot', ...args)
  },
  onSelectEvent: (...args) => {
    console.log(...args)
  },
  onDoubleClickEvent: (...args) => {
    console.log(...args)
  },
  onKeyPressEvent: (...args) => {
    console.log(...args)
  },
  selectable: true,
  popup: true,
  maxRows: 3,
  messages: {
    showMore: () => {
      return `Show All`
    },
  },
  getMoreEvents,
  formats: { dayFormat: 'ddd DD' },
}
