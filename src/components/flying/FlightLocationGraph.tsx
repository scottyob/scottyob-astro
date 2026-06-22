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

const getData = (flights: Flight[], byCountry: boolean = false) => {
  const result: { [location: string]: { [year: string]: number } } =
    flights.reduce(
      (acc: { [location: string]: { [year: string]: number } }, flight) => {
        const year = flight.date.split('-')[0];
        let location = flight.location || 'Unknown';
        if (byCountry) {
          location = flight.launch?.country || 'Unknown';
        }
        if (!acc[location]) acc[location] = {};
        if (!acc[location][year]) acc[location][year] = 0;
        acc[location][year] += (flight.durationSeconds || 0) / 60 / 60;
        return acc;
      },
      {}
    );

  const locationTotals = Object.fromEntries(
    Object.entries(result).map(([location, years]) => [
      location,
      Object.values(years).reduce((acc, c) => acc + c, 0),
    ])
  );

  return Object.entries(result)
    .map(([location, years]) => ({ location, ...years }))
    .sort((a, b) => locationTotals[b.location] - locationTotals[a.location]);
};

export default function FlightLocationGraph(props: Props) {
  const { flights } = props;

  const [byCountry, setByCountry] = useState(false);
  const siteFilter = useStore($siteFilter);
  const yearFilter = useStore($yearFilter);
  const [hoverYear, setHoverYear] = useState<string | undefined>();
  const effectiveYear = yearFilter ?? hoverYear;

  const data = getData(flights, byCountry);
  const years = Array.from(new Set(flights.map(f => f.date.substring(0, 4))));
  const yearColors = Object.fromEntries(
    years.map((year, i) => [year, colorSchemes.set3[i % colorSchemes.set3.length]])
  );

  const graph = (width: number) => (
    <div onClick={() => { $yearFilter.set(undefined); setHoverYear(undefined); }}>
      <Bar
        data={data}
        keys={years}
        totalsOffset={10}
        enableTotals
        width={width}
        height={props.height}
        indexBy={'location'}
        colors={(barProps) => {
          const base = yearColors[barProps.id as string] ?? colorSchemes.set3[0];
          const locationDimmed = siteFilter && barProps.indexValue !== siteFilter;
          const yearDimmed = effectiveYear && barProps.id !== effectiveYear;
          return locationDimmed || yearDimmed ? base + '44' : base;
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
        margin={{ bottom: 100, top: 30, left: 50, right: 30 }}
        indexScale={{ type: 'band', round: true }}
        axisLeft={{
          legend: 'Hours Flying',
          legendOffset: -40,
          legendPosition: 'middle',
        }}
        axisBottom={{
          tickRotation: -45,
          renderTick: ({ x, y, value }) => {
            const isSelected = !byCountry && siteFilter === value;
            const isDimmed = !byCountry && siteFilter && siteFilter !== value;
            return (
              <g
                transform={`translate(${x},${y})`}
                style={{ cursor: byCountry ? 'default' : 'pointer' }}
                onClick={(e) => {
                  if (byCountry) return;
                  e.stopPropagation();
                  $siteFilter.set(siteFilter === value ? undefined : String(value));
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
        valueFormat={'0.2f'}
      />
    </div>
  );

  return (
    <div>
      <div className="text-right mr-4">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={byCountry}
            className="sr-only peer"
            onChange={(event) => {
              setByCountry(event.target.checked);
              $yearFilter.set(undefined);
              $siteFilter.set(undefined);
              setHoverYear(undefined);
            }}
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
