import type { Flight } from '@libs/flyingTypes';
import { Bar } from '@nivo/bar';
import { colorSchemes } from '@nivo/colors';
import { useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';

export type Props = {
  height: number;
  flights: Flight[];
};

const getData = (flights: Flight[]) => {
  const result: { [wing: string]: { [year: string]: number } } = flights.reduce(
    (acc: { [wing: string]: { [year: string]: number } }, flight) => {
      const wing = flight.wing || 'Unknown';
      const year = flight.date.split('-')[0];
      if (!acc[wing]) acc[wing] = {};
      if (!acc[wing][year]) acc[wing][year] = 0;
      acc[wing][year] += (flight.durationSeconds || 0) / 60 / 60;
      return acc;
    },
    {}
  );

  const wingTotals = Object.fromEntries(
    Object.entries(result).map(([wing, years]) => [
      wing,
      Object.values(years).reduce((a, b) => a + b, 0),
    ])
  );

  return Object.entries(result)
    .map(([wing, years]) => ({ wing, ...years }))
    .sort((a, b) => wingTotals[b.wing] - wingTotals[a.wing]);
};

export default function FlightWingGraph(props: Props) {
  const { flights } = props;
  const [disabled, setDisabled] = useState<string[]>([]);

  const allYears = Array.from(new Set(flights.map((f) => f.date.substring(0, 4)))).sort();
  const yearColors: { [year: string]: string } = {};
  allYears.forEach(
    (year, i) =>
      (yearColors[year] = colorSchemes.set2[i % colorSchemes.set2.length])
  );

  const activeYears = allYears.filter((y) => !disabled.includes(y));
  const data = getData(flights.filter((f) => !disabled.includes(f.date.substring(0, 4))));

  const graph = (width: number) => (
    <Bar
      data={data}
      keys={activeYears}
      indexBy="wing"
      width={width}
      height={props.height}
      colors={(bar) => yearColors[bar.id as string]}
      margin={{ top: 30, right: 30, bottom: 100, left: 50 }}
      indexScale={{ type: 'band', round: true }}
      enableTotals
      totalsOffset={10}
      axisLeft={{
        legend: 'Hours Flying',
        legendOffset: -40,
        legendPosition: 'middle',
      }}
      axisBottom={{ tickRotation: -45 }}
      labelSkipHeight={20}
      valueFormat="0.2f"
    />
  );

  const legend = Object.entries(yearColors).map(([year, color]) => {
    const backgroundColor = color + (disabled.includes(year) ? '88' : 'FF');

    return (
      <div
        key={year}
        className="flex m-2 items-center"
        onClick={(event) => {
          if (!event.ctrlKey) {
            if (disabled.includes(year)) {
              setDisabled(disabled.filter((d) => d != year));
            } else {
              setDisabled([...disabled, year]);
            }
          } else {
            if (disabled.length && !disabled.includes(year)) {
              setDisabled([]);
            } else {
              setDisabled(Object.keys(yearColors).filter((y) => y != year));
            }
          }
        }}
      >
        <div
          className="inline h-full min-w-5 aspect-square mr-1"
          style={{ backgroundColor }}
        />
        <div style={{ color: disabled.includes(year) ? '#888' : 'inherit' }}>{year}</div>
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
