export type Day =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

// Dictionary where keys are of type Day and values are numbers
const dayMap: Record<Day, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

import type { DateOrString } from '@nivo/calendar/dist/types/types';
import { $highlightedDatesStore } from './stores';

function getDaysOfWeekBetween(
  from: DateOrString,
  to: DateOrString,
  day: number
) {
  // Parse the input strings into Date objects
  const startDate = new Date(from);
  const endDate = new Date(to);

  const days = [];

  // Iterate from startDate to endDate
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // Check if the current day is Tuesday (Day 2 of the week)
    if (currentDate.getDay() === day) {
      // If it is a Tuesday, format it as YYYY-MM-DD and add to the array
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      days.push(`${year}-${month}-${day}`);
    }

    // Increment the date by one day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
}

export default function HightlightDaysOnCalendar(props: {
  from: DateOrString,
  to: DateOrString,
  instanceKey: string;
  day: Day;
  className?: string;
  resetInSeconds?: number;
}) {

  const {from, to, instanceKey, day, className} = props;
  const resetInSeconds = props.resetInSeconds || 2;

  const setMap = () => {
        // Updates the instance of the calendar to highlight entries
        let map = $highlightedDatesStore.get();
        const newMap = {...map, [instanceKey]: getDaysOfWeekBetween(from, to, dayMap[day])}
        $highlightedDatesStore.set(newMap);
  }

  const clearMap = () => {
        // Updates the instance of the calendar to highlight entries
        let map = $highlightedDatesStore.get();
        const newMap = {...map, [instanceKey]: []}
        $highlightedDatesStore.set(newMap);
  }

  return (
    <span
      className={className}
      onClick={async () => {
        setMap();
        setTimeout(() => clearMap(), resetInSeconds * 1000);
      }}
      onMouseEnter={setMap}
      onMouseLeave={clearMap}
    >
      {props.day}
    </span>
  );
}
