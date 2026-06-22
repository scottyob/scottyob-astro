import type { Flight } from '@libs/flyingTypes';
import { Calendar } from '@nivo/calendar';
import { Modal } from 'pretty-modal';
import './flycal.css';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { compute } from 'compute-scroll-into-view';

export type Props = {
  flights: Flight[];
  verticle?: boolean;
};

const TODAY = new Date().toISOString().split('T')[0];

// Sentinel value -1 = today's cell (shown in blue)
// Duration colours use ColorBrewer 5-class Greens
const flightColorScale = (value: number): string => {
  if (value < 0)    return '#2196f3'; // blue:         today
  if (value <= 30)  return '#c7e9c0'; // mint:         0–30 m
  if (value <= 60)  return '#74c476'; // medium green: 30 m–1 h
  if (value <= 120) return '#31a354'; // green:        1–2 h
  if (value <= 180) return '#006d2c'; // dark green:   2–3 h
  return '#00441b';                   // forest:       3 h+
};

const logbookStats = (flights: Flight[]) => {
  flights = flights.sort((a, b) => a.date.localeCompare(b.date));
  if (flights.length == 0) {
    throw new Error('Need at least one flight');
  }

  const lastDate = flights.at(-1)!.date;
  // Extend the calendar to today for the current year so today's cell is rendered
  const to = lastDate.substring(0, 4) === TODAY.substring(0, 4) && TODAY > lastDate
    ? TODAY
    : lastDate;

  return {
    from: flights[0].date,
    to,
    flights,
  };
};

const minutesByDay = (flights: Flight[]) => {
  const ret: { [date: string]: number } = {};
  flights.forEach((f) => {
    const flightDuration = f.durationSeconds ?? 1;
    const minutes = f.date in ret ? ret[f.date] : 0;
    ret[f.date] = minutes + flightDuration / 60.0;
  });
  const data = Object.entries(ret).map(([date, duration]) => ({
    day: date,
    value: date === TODAY ? -1 : Math.round(duration),
  }));
  // Always include today with sentinel so it gets the blue colour
  if (!(TODAY in ret)) {
    data.push({ day: TODAY, value: -1 });
  }
  return data;
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

type HoveredDay = { day: string; x: number; y: number };

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

    if (!lastElementWithMonthText) { return; }

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
        width = Math.floor(window.innerWidth * 0.96 - 16);
        break;
      default:
        height = 100;
        width = 600;
    }

    const yearFlights = flightsByYear(props.flights);
    // First year: height=100, marginTop=20, marginBottom=1 → 79px inner → 11.3px/row
    // Non-first:  height=84,  marginTop=4,  marginBottom=1 → 79px inner → 11.3px/row (same cell size)
    const nonFirstHeight = mode === 'verticle' ? height : Math.round(height * 0.84);
    return yearFlights.map((flights, i) => {
      const stats = logbookStats(flights);
      const isFirst = i === 0;

      return (
        <div
          key={'mode-' + i}
          className={'relative snap-center text-xs shrink-0 '}
          id={
            (i == yearFlights.length - 1 && 'current-year-calendar') ||
            undefined
          }
        >
          {mode !== 'verticle' && (
            <div style={{
              position: 'absolute',
              left: 2,
              top: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontSize: '10px',
              fontStyle: 'italic',
              color: '#888',
              pointerEvents: 'none',
              zIndex: 1,
            }}>
              {stats.from.substring(0, 4)}
            </div>
          )}
          <div className="m-auto">
            <Calendar
              data={minutesByDay(stats.flights)}
              from={stats.from}
              to={stats.to}
              direction={mode == "verticle" ? 'vertical' : 'horizontal'}
              emptyColor="#eeeeee"
              colorScale={flightColorScale as any}
              margin={{
                top: (mode === 'small' && !isFirst) ? 4 : 20,
                right: verticle ? 10 : 0,
                bottom: 1,
                left: (isFirst || mode === 'verticle') ? 20 : 16,
              }}
              monthLegend={(mode === 'small' && !isFirst) ? () => '' : undefined}
              yearLegend={mode !== 'verticle' ? () => '' : undefined}
              yearSpacing={40}
              monthBorderColor="#ffffff"
              dayBorderWidth={1}
              dayBorderColor="#ffffff"
              align="top-left"
              legends={[]}
              tooltip={() => null}
              onMouseEnter={(datum, event) => {
                setHovered({ day: datum.day, x: event.clientX, y: event.clientY });
              }}
              onMouseMove={(_datum, event) => {
                setHovered((h) => h ? { ...h, x: event.clientX, y: event.clientY } : h);
              }}
              onMouseLeave={() => setHovered(null)}
              height={(mode === 'small' && !isFirst) ? nonFirstHeight : height}
              width={width}
            />
          </div>
        </div>
      );
    });
  };

  const dayFlights = hovered ? (allDayMap[hovered.day] ?? []) : [];
  const locations = [...new Set(dayFlights.map((f) => f.location).filter(Boolean))];
  const totalMinutes = Math.round(dayFlights.reduce((sum, f) => sum + (f.durationSeconds ?? 0) / 60, 0));

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
          <div><strong>{hovered.day}{hovered.day === TODAY ? ' (today)' : ''}</strong></div>
          {dayFlights.length > 0
            ? <div>{formatDuration(totalMinutes)} &mdash; {dayFlights.length} flight{dayFlights.length !== 1 ? 's' : ''}</div>
            : <div style={{ color: '#888' }}>No flights</div>
          }
          {locations.length > 0 && <div style={{ color: '#666' }}>{locations.join(', ')}</div>}
        </div>,
        document.body
      )}

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        parentClass="fly-calendar-modal"
      >
        <div className='md:hidden'>
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
