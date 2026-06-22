import type { Flight } from '@libs/flyingTypes';
import { Calendar } from '@nivo/calendar';
import './flycal.css';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

const flightsByDay = (flights: Flight[]): { [date: string]: Flight[] } => {
  const map: { [date: string]: Flight[] } = {};
  flights.forEach((f) => {
    if (!map[f.date]) map[f.date] = [];
    map[f.date].push(f);
  });
  return map;
};

const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
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

type HoveredDay = { day: string; value: number; x: number; y: number };

export default function FlyCalendar(props: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState<HoveredDay | null>(null);

  const { verticle } = props;
  const allDayMap = flightsByDay(props.flights);

  useEffect(() => {
    if (!messagesEndRef.current) { return; }

    const currentMonth = new Date().toLocaleString('en-US', {
      month: 'short',
    });
    const elements = Array.from(
      messagesEndRef.current.querySelectorAll('text')
    );
    const lastElementWithMonthText = elements.findLast(
      (element) => element.textContent?.trim() === currentMonth
    );

    if (!lastElementWithMonthText) {
      throw new Error('Could not find last element with month text');
    }

    const actions = compute(lastElementWithMonthText, {
      scrollMode: 'if-needed',
      inline: 'center',
    });

    actions.forEach(({ el, left }) => {
      el.scrollLeft = left;
    });

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
              direction={mode == "verticle" ? 'vertical' : 'horizontal'}
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
              tooltip={() => null}
              onMouseEnter={(datum, event) => {
                setHovered({ day: datum.day, value: datum.value ?? 0, x: event.clientX, y: event.clientY });
              }}
              onMouseMove={(datum, event) => {
                setHovered((h) => h ? { ...h, x: event.clientX, y: event.clientY } : h);
              }}
              onMouseLeave={() => setHovered(null)}
              height={height}
              width={width}
            />
          </div>
        </div>
      );
    });
  };

  const dayFlights = hovered ? (allDayMap[hovered.day] ?? []) : [];
  const locations = [...new Set(dayFlights.map((f) => f.location).filter(Boolean))];

  return (
    <>
      {hovered && createPortal(
        <div style={{
          position: 'fixed',
          left: hovered.x + 12,
          top: hovered.y + 12,
          background: 'white',
          padding: '8px 10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '12px',
          lineHeight: '1.6',
          pointerEvents: 'none',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          <div><strong>{hovered.day}</strong></div>
          <div>{formatDuration(hovered.value)} &mdash; {dayFlights.length} flight{dayFlights.length !== 1 ? 's' : ''}</div>
          {locations.length > 0 && <div style={{ color: '#666' }}>{locations.join(', ')}</div>}
        </div>,
        document.body
      )}

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
          'inline-flex overflow-x-scroll max-w-full snap-x ' +
          (verticle && 'mt-16 calendar-fade snap-mandatory')
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
