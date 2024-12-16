import type { Flight } from '@libs/flying';
import { Bar } from '@nivo/bar';
import { colorSchemes } from '@nivo/colors';
import { useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

export type Props = {
  height: number;
  flights: Flight[];
};

const getData = (flights: Flight[]) => {
  const result: { [year: string]: { [location: string]: number } } =
    flights.reduce(
      (acc: { [year: string]: { [location: string]: number } }, flight) => {
        const year = flight.date.split('-')[0]; // extract year from date
        const location = flight.location || 'Unknown'; // use 'Unknown' if location is undefined
        if (!acc[year]) {
          acc[year] = {};
        }
        if (!acc[year][location]) {
          acc[year][location] = 0;
        }
        acc[year][location] += (flight.durationSeconds || 0) / 60 / 60; // add duration to existing location
        return acc;
      },
      {}
    );

  const formattedResult = Object.entries(result).map(([year, locations]) => {
    const ret = { "year": year, ...locations };
    return ret;
  });

  return formattedResult;
};

export default function FlightYearGraph(props: Props) {
  const { flights } = props;
  const [disabled, setDisabled] = useState<string[]>([]);

  const data = getData(
    flights.filter((f) => !disabled.includes(f.location ?? 'Unknown'))
  );
  const locationColors: { [color: string]: string } = {};
  Array.from(
    new Set(props.flights.map((f) => f.location ?? 'Unknown'))
  ).forEach(
    (color, i) =>
      (locationColors[color] = colorSchemes.set3[i % colorSchemes.set3.length])
  );

  const graph = (width: number) => (
    <Bar
      data={data}
      totalsOffset={10}
      enableTotals
      width={width}
      height={props.height}
      indexBy={'year'}
      colors={(props) => locationColors[props.id as string]}
      margin={{
        bottom: 30,
        top: 30,
        left: 50,
        right: 30,
      }}
      indexScale={{ type: 'band', round: true }}
      keys={Array.from(new Set(flights.map((f) => f.location || 'Unknown')))}
      axisLeft={{
        legend: 'Hours Flying',
        legendOffset: -40,
        legendPosition: 'middle',
      }}
      labelSkipHeight={20}
      valueFormat={'0.2f'}
    />
  );

  const legend = Object.entries(locationColors).map(([location, color]) => {
    const backgroundColor = color + (disabled.includes(location) ? '88' : 'FF');

    return (
      <div
        key={location}
        className="flex m-2 items-center"
        onClick={(event) => {
          if (!event.ctrlKey) {
            // Toggle single item unless control key is selected
            if (disabled.includes(location)) {
              setDisabled(disabled.filter((d) => d != location));
            } else {
              setDisabled([...disabled, location]);
            }
          } else {
            // Isolate selection with the ctrl key
            if (disabled.length && !disabled.includes(location)) {
              setDisabled([]);
            } else {
              // Everythingn except this location
              setDisabled(
                Object.keys(locationColors).filter((l) => l != location)
              );
            }
          }
        }}
      >
        <div
          className="inline h-full min-w-5 aspect-square mr-1"
          style={{ backgroundColor: backgroundColor }}
        />
        <div className="" style={{
            color: disabled.includes(location) ? "#888" : "inherit"
        }}>{location}</div>
      </div>
    );
  });

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: '1 1 auto' }}>
        <AutoSizer disableHeight>
          {({ width }) => (
            <>
              {graph(width)}
              <div
                style={{ width }}
                className="legend text-xs flex flex-wrap justify-center"
              >
                {legend}
              </div>
            </>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}
