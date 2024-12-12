import type { Flight } from '@libs/flying';
import { Calendar } from '@nivo/calendar';
import AutoSizer from 'react-virtualized-auto-sizer';
import './flycal.css';
import { useEffect, useRef } from 'react';
import { compute } from 'compute-scroll-into-view'

export type Props = {
  flights: Flight[];
};

function calculateDimensions(width: number) {
  // Define the maximum possible height
  let RATIO = 0.2; // Ratio number to keep a calendar looking good
  RATIO = 0.14; // Ratio number to keep a calendar looking good

  return {
    height: width > 1050 ? 210 : width * 0.2,
    width: width > 1050 ? 1050 : width,
  };
}

const logbookStats = (flights: Flight[]) => {
  flights = flights.sort((a, b) => a.date.localeCompare(b.date));
  if (flights.length == 0) {
    throw new Error('Need at least one flight');
  }

  return {
    from: flights[0].date,
    to: flights.at(-1)?.date as string,
    minValue: 1,
    maxValue: 60 * 3, // 3 hours.
    flights: flights,
  };
};

const minutesByDay = (flights: Flight[]) => {
  const ret: { [date: string]: number } = {};
  flights.forEach((f) => {
    const flightDuration = f.durationSeconds ?? 1;
    const minutes = f.date in ret ? ret[f.date] : 0;
    ret[f.date] = minutes + flightDuration / 60.0;
  });
  return Object.entries(ret).map(([date, duration]) => ({
    day: date,
    value: Math.round(duration),
  }));
};

// Returns flights grouped by year
const flightsByYear = (flights: Flight[]): Flight[][] => {
  const byYear: { [year: string]: Flight[] } = {};

  flights.forEach((f) => {
    const year = f.date.substring(0, 4);
    const soFar = byYear[year] ?? [];

    byYear[f.date.substring(0, 4)] = [...soFar, f];
  });
  return Object.values(byYear).sort((a, b) =>
    a[0].date.localeCompare(b[0].date)
  );
};

export default function FlyCalendar(props: Props) {
  
  const messagesEndRef = useRef(null);
  // Effect to scroll to the bottom of chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      console.log("It is set");

      const currentMonth = new Date().toLocaleString("en-US", { month: "short" }); // e.g., "Dec"
      const elements = Array.from(messagesEndRef.current.querySelectorAll("text")); // get all descendant elements
      const lastElementWithMonthText = elements.findLast((element) => element.textContent.trim() === currentMonth);
      
      // lastElementWithMonthText.scrollIntoView({inline: "center"});

      const actions = compute(lastElementWithMonthText, {
         scrollMode: 'if-needed',
         inline: "center",
      });

      actions.forEach(({el, top, left}) => {
        // el.scrollTop = top;
        el.scrollLeft = left;
      }) 
      // messagesEndRef.current.scrollLeft = actions.

      // lastElementWithMonthText.scrollIntoView({ inline: 'start', boundary: carousel });
    }
  }, [messagesEndRef]);
  
  // Generate one calendar per year
  const flights = () => {
    const yearFlights = flightsByYear(props.flights);
    return yearFlights.map((flights, i) => {
      const stats = logbookStats(flights);
      // debugger;

      // const { width, height } = calculateDimensions(maxWidth);

      return (
        <div
          key={i}
          className="snap-center text-xs shrink-0"
          id={
            (i == yearFlights.length - 1 && 'current-year-calendar') ||
            undefined
          }
        >
          <div className="italic text-left">
            {stats.from.substring(0, 4)}
          </div>
          <div className="m-auto">
            <Calendar
              data={minutesByDay(stats.flights)}
              from={stats.from}
              to={stats.to}
              emptyColor="#eeeeee"
              colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
              margin={{ top: 20, right: 0, bottom: 1, left: 0 }}
              yearSpacing={40}
              monthBorderColor="#ffffff"
              dayBorderWidth={2}
              dayBorderColor="#ffffff"
              align="top-left"
              minValue={stats.minValue}
              maxValue={stats.maxValue}
              legends={[]}
              height={100} // width / 8}
              width={600}
            />
          </div>
        </div>
      );
    });
  };

  return (
              <div
                className="inline-flex overflow-x-scroll max-w-full"
                ref={messagesEndRef}
              >
                  {flights()}
              </div>
  );
}
