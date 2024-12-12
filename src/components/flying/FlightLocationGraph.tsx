import type { Flight } from '@libs/flying';
import { Bar } from '@nivo/bar';
import { colorSchemes } from '@nivo/colors';
import { useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

export type Props = {
  height: number;
  flights: Flight[];
};

interface Group {
  year: string;
  location: string;
  duration: number;
}

const getData = (flights: Flight[]) => {
  const result: { [location: string]: { [year: string]: number } } =
    flights.reduce(
      (acc: { [location: string]: { [year: string]: number } }, flight) => {
        const year = flight.date.split('-')[0]; // extract year from date
        const location = flight.location || 'Unknown'; // use 'Unknown' if location is undefined
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
    console.log('Initial result was: ', result);
    const ret = { location, ...years };
    // debugger;
    return ret;
  }).sort((a, b) => locationTotals[b.location] - locationTotals[a.location]);

  return formattedResult;
};

export default function FlightYearGraph(props: Props) {
  const { flights } = props;

  const data = getData(flights);
  console.log('By year data', data);

  const graph = (width: number) => (
    <Bar
      data={data}
      keys={Array.from(new Set(flights.map(f => f.date.substring(0, 4)))) }
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
    <div style={{ display: 'flex' }}>
      <div style={{ flex: '1 1 auto' }}>
        <AutoSizer disableHeight>
          {({ width }) => <>{graph(width)}</>}
        </AutoSizer>
      </div>
    </div>
  );
}
