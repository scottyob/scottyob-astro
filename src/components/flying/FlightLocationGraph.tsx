import type { Flight } from '@libs/flyingTypes';
import { Bar } from '@nivo/bar';
import { useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

export type Props = {
  height: number;
  flights: Flight[];
};

const getData = (flights: Flight[], byCountry: boolean = false) => {
  const result: { [location: string]: { [year: string]: number } } =
    flights.reduce(
      (acc: { [location: string]: { [year: string]: number } }, flight) => {
        const year = flight.date.split('-')[0]; // extract year from date
        let location = flight.location || 'Unknown'; // use 'Unknown' if location is undefined
        if(byCountry) {
          location = flight.launch?.country || 'Unknown'; // use 'Unknown' if location is undefined
        }
        if (!acc[location]) {
          acc[location] = {};
        }
        if (!acc[location][year]) {
          acc[location][year] = 0;
        }
        acc[location][year] += (flight.durationSeconds || 0) / 60 / 60; // add duration to existing location
        return acc;
      },
      {}
    );

  // Get location totals
  const locationTotals = Object.fromEntries(
    Object.entries(result).map(([location, years]) => [
      location,
      Object.values(years).reduce((acc, c) => acc + c, 0),
    ])
  );

  const formattedResult = Object.entries(result).map(([location, years]) => {
    const ret = { location, ...years };
    return ret;
  }).sort((a, b) => locationTotals[b.location] - locationTotals[a.location]);

  return formattedResult;
};

export default function FlightYearGraph(props: Props) {
  const { flights } = props;

  const [byCountry, setByCountry] = useState(false);

  // Recompute data when flights or byCountry changes
  const data = getData(flights, byCountry);

  const years = Array.from(new Set(flights.map(f => f.date.substring(0, 4))));

  const graph = (width: number) => (
    <Bar
      data={data}
      keys={years}
      colorBy={"id"}
      totalsOffset={10}
      enableTotals
      width={width}
      height={props.height}
      indexBy={'location'}
      colors={{ scheme: 'set3' }}
      margin={{
        bottom: 100,
        top: 30,
        left: 50,
        right: 30,
      }}
      indexScale={{ type: 'band', round: true }}
      axisLeft={{
        legend: 'Hours Flying',
        legendOffset: -40,
        legendPosition: 'middle',
      }}
      axisBottom={{
        tickRotation: -45
      }}
      labelSkipHeight={20}
      valueFormat={'0.2f'}
    />
  );

  return (
    <div>
      <div className="text-right mr-4">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={byCountry}
            className="sr-only peer"
            onChange={(event) => setByCountry(event.target.checked)}
          />
          <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600 dark:peer-checked:bg-orange-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">By Country</span>
        </label>
      </div>

      <div style={{ display: 'flex' }}>
        <div style={{ flex: '1 1 auto' }}>
          <AutoSizer disableHeight>
            {({ width }) => <>{graph(width)}</>}
          </AutoSizer>
        </div>
      </div>
    </div>
  );
}
