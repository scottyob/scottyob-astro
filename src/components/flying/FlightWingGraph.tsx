import type { Flight } from '@libs/flyingTypes';
import { Bar } from '@nivo/bar';
import { colorSchemes } from '@nivo/colors';
import { useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useStore } from '@nanostores/react';
import { $yearFilter, $wingFilter } from '@libs/flightFilterStore';

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

  const yearFilter = useStore($yearFilter);
  const wingFilter = useStore($wingFilter);
  const [hoverYear, setHoverYear] = useState<string | undefined>();
  const effectiveYear = yearFilter ?? hoverYear;

  const allYears = Array.from(new Set(flights.map((f) => f.date.substring(0, 4)))).sort();
  const yearColors = Object.fromEntries(
    allYears.map((year, i) => [year, colorSchemes.set2[i % colorSchemes.set2.length]])
  );

  const data = getData(flights);

  const graph = (width: number) => (
    <div onClick={() => { $yearFilter.set(undefined); setHoverYear(undefined); }}>
      <Bar
        data={data}
        keys={allYears}
        indexBy="wing"
        width={width}
        height={props.height}
        colors={(bar) => {
          const base = yearColors[bar.id as string] ?? colorSchemes.set2[0];
          const wingDimmed = wingFilter && bar.indexValue !== wingFilter;
          const yearDimmed = effectiveYear && bar.id !== effectiveYear;
          return wingDimmed || yearDimmed ? base + '44' : base;
        }}
        onClick={(datum, event) => {
          event.stopPropagation();
          const year = datum.id as string;
          $yearFilter.set(yearFilter === year ? undefined : year);
        }}
        onMouseEnter={(datum) => {
          if (!yearFilter) setHoverYear(datum.id as string);
        }}
        onMouseLeave={() => {
          if (!yearFilter) setHoverYear(undefined);
        }}
        margin={{ top: 30, right: 30, bottom: 100, left: 50 }}
        indexScale={{ type: 'band', round: true }}
        enableTotals
        totalsOffset={10}
        axisLeft={{
          legend: 'Hours Flying',
          legendOffset: -40,
          legendPosition: 'middle',
        }}
        axisBottom={{
          tickRotation: -45,
          renderTick: ({ x, y, value }) => {
            const isSelected = wingFilter === value;
            const isDimmed = wingFilter && wingFilter !== value;
            return (
              <g
                transform={`translate(${x},${y})`}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  $wingFilter.set(wingFilter === value ? undefined : String(value));
                }}
              >
                <line x1={0} x2={0} y1={0} y2={5} stroke="currentColor" strokeOpacity={isDimmed ? 0.3 : 1} />
                <text
                  textAnchor="end"
                  transform="translate(0,8) rotate(-45)"
                  style={{
                    fontSize: 11,
                    fill: isSelected ? '#f97316' : isDimmed ? '#aaa' : 'currentColor',
                    fontWeight: isSelected ? 'bold' : 'normal',
                  }}
                >
                  {value}
                </text>
              </g>
            );
          },
        }}
        labelSkipHeight={20}
        valueFormat="0.2f"
      />
    </div>
  );

  const legend = allYears.map((year) => {
    const isPinned = yearFilter === year;
    const color = yearColors[year];
    const backgroundColor = color + (effectiveYear === year ? 'FF' : '88');

    return (
      <div
        key={year}
        className="flex m-2 items-center cursor-pointer select-none"
        onClick={() => $yearFilter.set(isPinned ? undefined : year)}
        onMouseEnter={() => { if (!yearFilter) setHoverYear(year); }}
        onMouseLeave={() => { if (!yearFilter) setHoverYear(undefined); }}
      >
        <div
          className={`inline h-full min-w-5 aspect-square mr-1 ${isPinned ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : ''}`}
          style={{ backgroundColor }}
        />
        <div>{year}</div>
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
