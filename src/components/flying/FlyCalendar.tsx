import type { Flight } from '@libs/flying';
import { Calendar } from '@nivo/calendar';
import AutoSizer from 'react-virtualized-auto-sizer';
import './flycal.css';
import { useEffect, useRef, useState } from 'react';
import { compute } from 'compute-scroll-into-view';
import { Modal } from 'pretty-modal';

export type Props = {
  flights: Flight[];
  verticle?: boolean;
};

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
  const [isOpen, setIsOpen] = useState(false);

  const { verticle } = props;

  // Effect to scroll to the bottom of chat messages
  useEffect(() => {
    if (messagesEndRef.current) {
      console.log('It is set');

      const currentMonth = new Date().toLocaleString('en-US', {
        month: 'short',
      }); // e.g., "Dec"
      const elements = Array.from(
        messagesEndRef.current.querySelectorAll('text')
      ); // get all descendant elements
      const lastElementWithMonthText = elements.findLast(
        (element) => element.textContent.trim() === currentMonth
      );

      // lastElementWithMonthText.scrollIntoView({inline: "center"});

      const actions = compute(lastElementWithMonthText, {
        scrollMode: 'if-needed',
        inline: 'center',
      });

      actions.forEach(({ el, top, left }) => {
        // el.scrollTop = top;
        el.scrollLeft = left;
      });
      // messagesEndRef.current.scrollLeft = actions.

      // lastElementWithMonthText.scrollIntoView({ inline: 'start', boundary: carousel });
    }
  }, [messagesEndRef]);

  // Generate one calendar per year
  const flights = (mode?: 'verticle' | 'horizontal' | 'small') => {
    let height = 0;
    let width = 0;
    switch (mode) {
      case 'verticle':
        height = 650;
        width = 120;
        break;
      case 'small':
        height = 100;
        width = 300;
        break;
      default:
        height = 100;
        width = 600;
    }

    const yearFlights = flightsByYear(props.flights);
    return yearFlights.map((flights, i) => {
      const stats = logbookStats(flights);

      return (
        <div
          key={'mode-' + i}
          className={'snap-center text-xs shrink-0 '}
          id={
            (i == yearFlights.length - 1 && 'current-year-calendar') ||
            undefined
          }
        >
          {!verticle && (
            <div className="italic text-left">{stats.from.substring(0, 4)}</div>
          )}
          <div className="m-auto">
            <Calendar
              data={minutesByDay(stats.flights)}
              from={stats.from}
              to={stats.to}
              direction={ mode == "verticle" ? 'vertical' : 'horizontal'}
              emptyColor="#eeeeee"
              colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
              margin={{
                top: 20,
                right: verticle ? 10 : 0,
                bottom: 1,
                left: 20,
              }}
              yearSpacing={40}
              monthBorderColor="#ffffff"
              dayBorderWidth={1}
              dayBorderColor="#ffffff"
              align="top-left"
              minValue={stats.minValue}
              maxValue={stats.maxValue}
              legends={[]}
              height={height} // width / 8}
              width={width}
            />
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <Modal
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      >
        <div className='md:hidden -m-4'>
          {flights('small')}
        </div>
        <div className='hidden md:block'>
          {flights('horizontal')}
        </div>
      </Modal>

      <div
        className={
          'inline-flex overflow-x-scroll max-w-full snap-x snap-mandatory ' +
          (verticle && 'mt-16 calendar-fade')
        }
        ref={messagesEndRef}
      >
        <div className="min-w-[60px]">.</div>
        {flights(verticle ? 'verticle' : 'horizontal')}
        <div className="min-w-[60px]">.</div>
      </div>
      <div
        className="text-xs italic text-orange-600 text-right mr-8 cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        (...See More)
      </div>
    </>
  );
}
