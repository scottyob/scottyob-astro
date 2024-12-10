import type { Flight } from '@libs/flying';
import { Calendar } from '@nivo/calendar';
import AutoSizer from 'react-virtualized-auto-sizer';
import './flycal.css'

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
  // Generate one calendar per year

  const flights = (maxWidth: number) => {
    const yearFlights = flightsByYear(props.flights).reverse();
    return yearFlights.map((flights, i) => {
      const stats = logbookStats(flights);
      // debugger;

      const { width, height } = calculateDimensions(maxWidth);

      return (
        <div key={i} className="snap-center" id={(i == yearFlights.length - 1 && "current-year-calendar") || undefined}>
          <Calendar
            data={minutesByDay(stats.flights)}
            from={stats.from}
            to={stats.to}
            emptyColor="#eeeeee"
            colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
            margin={{ top: 20, right: 30, bottom: 1, left: 20 }}
            yearSpacing={40}
            monthBorderColor="#ffffff"
            dayBorderWidth={2}
            dayBorderColor="#ffffff"
            align="top-left"
            minValue={stats.minValue}
            maxValue={stats.maxValue}
            legends={[]}
            height={height} // width / 8}
            width={width}
          />
        </div>
      );
    });
  }

  const slides = [<div>Slide 1</div>, <div>Slide 2</div>, <div>Slide 3</div>];

  return (
    <div style={{ display: 'flex' }} className='font-thin text-xs'>
      <div style={{ flex: '1 1 auto'}}>
        <AutoSizer disableHeight>
          {(dimensions) => {
            const originalWidth = dimensions.width
            let { width, height } = calculateDimensions(originalWidth);

            console.log(width);

            return <div className="calendar-container overflow-y-scroll snap-y snap-mandatory overscroll-y-auto overscroll-x-none" style={{ width: width, height: height * 2 }}>
              <div className="mt-[2100px] mb-[2100px]">
              {flights(originalWidth)}
              </div>
            </div>;
          }}
        </AutoSizer>
      </div>
    </div>
  );
}
