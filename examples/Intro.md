## <a id='intro' href='#intro'>Getting Started</a>

You can install `react-big-calendar` via npm:

```js
npm i --save react-big-calendar
```

Styles can be found at: `react-big-calendar/lib/css/react-big-calendar.css`, and should be included on the page
with the calendar component.

Date internationalization and localization is __hard__ and `react-big-calendar` doesn't even attempt to
solve that problem. Instead you can use one of the many excellent solutions already
out there, via adapters called "localizers". Big Calendar comes with two localizers for use
with [Globalize.js](https://github.com/jquery/globalize) (v0.1.0 supported) or [Moment.js](http://momentjs.com/).

Choose the localizer that best suits your needs, or write your own. Whatever you do, you'll need to set it up
before you can use the calendar (you only need to set it up once).

```jsx
import BigCalendar from 'react-big-calendar';
import moment from 'moment';

// Setup the localizer by providing the moment (or globalize) Object
// to the correct localizer.
BigCalendar.momentLocalizer(moment); // or globalizeLocalizer

let MyCalendar = props => (
  <div>
    <BigCalendar
      events={myEventsList}
      startAccessor='startDate'
      endAccessor='endDate'
    />
  </div>
);
```

Once you've configured a localizer, the Calendar is ready to accept `dateFormat` props. These props determine
how dates will be displayed throughout the component and are specific to the localizer of your choice. For
instance if you are using the Moment localizer,
then any [Moment format pattern](http://momentjs.com/docs/#/displaying/format/) is valid!