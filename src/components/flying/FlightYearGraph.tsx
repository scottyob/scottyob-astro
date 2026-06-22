import type { Flight } from '@libs/flyingTypes';
import { Bar } from '@nivo/bar';
import { colorSchemes } from '@nivo/colors';
import { useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useStore } from '@nanostores/react';
import { $siteFilter, $yearFilter } from '@libs/flightFilterStore';

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
  const siteFilter = useStore($siteFilter);
  const yearFilter = useStore($yearFilter);
  const [hoverHighlight, setHoverHighlight] = useState<string | undefined>();
  const highlighted = siteFilter ?? hoverHighlight;

  const data = getData(flights);
  const locationColors: { [color: string]: string } = {};
  Array.from(
    new Set(props.flights.map((f) => f.location ?? 'Unknown'))
  ).forEach(
    (color, i) =>
      (locationColors[color] = colorSchemes.set3[i % colorSchemes.set3.length])
  );

  const graph = (width: number) => (
    <div onClick={() => { $siteFilter.set(undefined); $yearFilter.set(undefined); setHoverHighlight(undefined); }}>
      <Bar
        data={data}
        totalsOffset={10}
        enableTotals
        width={width}
        height={props.height}
        indexBy={'year'}
        colors={(barProps) => {
          const base = locationColors[barProps.id as string] ?? colorSchemes.set3[0];
          const locationDimmed = highlighted && barProps.id !== highlighted;
          const yearDimmed = yearFilter && barProps.indexValue !== yearFilter;
          return locationDimmed || yearDimmed ? base + '44' : base;
        }}
        onClick={(datum, event) => {
          event.stopPropagation();
          const location = datum.id as string;
          $siteFilter.set(siteFilter === location ? undefined : location);
        }}
        margin={{ bottom: 60, top: 30, left: 50, right: 30 }}
        indexScale={{ type: 'band', round: true }}
        keys={Array.from(new Set(flights.map((f) => f.location || 'Unknown')))}
        axisLeft={{
          legend: 'Hours Flying',
          legendOffset: -40,
          legendPosition: 'middle',
        }}
        axisBottom={{
          renderTick: ({ x, y, value }) => {
            const isSelected = yearFilter === value;
            const isDimmed = yearFilter && yearFilter !== value;
            return (
              <g
                transform={`translate(${x},${y})`}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  $yearFilter.set(yearFilter === value ? undefined : String(value));
                }}
              >
                <line x1={0} x2={0} y1={0} y2={5} stroke="currentColor" strokeOpacity={isDimmed ? 0.3 : 1} />
                <text
                  textAnchor="middle"
                  transform="translate(0,16)"
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
        valueFormat={'0.2f'}
      />
    </div>
  );

  const legend = Object.entries(locationColors).map(([location, color]) => {
    const isPinned = siteFilter === location;
    const backgroundColor = color + (highlighted === location ? 'FF' : '88');

    return (
      <div
        key={location}
        className="flex m-2 items-center cursor-pointer select-none"
        onClick={() => $siteFilter.set(isPinned ? undefined : location)}
        onMouseEnter={() => { if (!siteFilter) setHoverHighlight(location); }}
        onMouseLeave={() => { if (!siteFilter) setHoverHighlight(undefined); }}
      >
        <div
          className={`inline h-full min-w-5 aspect-square mr-1 ${isPinned ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : ''}`}
          style={{ backgroundColor }}
        />
        <div>{location}</div>
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
