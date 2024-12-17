import type { Flight } from '@libs/flyingTypes';
import { ScatterPlot } from '@nivo/scatterplot';
import prettyMilliseconds from 'pretty-ms';
import { useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { colorSchemes } from '@nivo/colors';

export type Props = {
  flights: Flight[];
  height: number;
};

function generateData(flights: Flight[]) {
  const data: {
    id: string;
    data: {
      x: string;
      y: number;
      flight: Flight;
    }[];
  }[] = [];

  flights.forEach((flight) => {
    const flightLocation = flight.location ?? 'Unknown';

    const existingLocation = data.find((item) => item.id === flightLocation);
    const point = {
      x: flight.date,
      y: (flight.durationSeconds ?? 0) / 60,
      flight: flight,
    };

    if (existingLocation) {
      existingLocation.data.push(point);
    } else {
      data.push({
        id: flightLocation,
        data: [point],
      });
    }
  });

  return data;
}

export default function FlightPlotGraph(props: Props) {
  const [highlighted, setHighlighted] = useState<string | undefined>();
  // const [customLegends, setCustomLegends] = useState<LegendDatum<SampleDatum>[]>([])

  const data = generateData(props.flights);

  const chart = (width: number) => (
    <div className="min-h-[400px]">
      <ScatterPlot
        data={data}
        height={props.height}
        width={width}
        colors={{
          scheme: 'set3',
        }}
        xScale={{
          type: 'time',
          format: '%Y-%m-%d',
          precision: 'day',
        }}
        xFormat="time:%Y-%m-%d"
        yFormat={(duration) =>
          prettyMilliseconds(duration * 60 * 1000, { hideSeconds: true })
        }
        axisBottom={{
          format: '%Y-%m',
          tickValues: 'every 6 months',
          tickRotation: -45,
        }}
        axisLeft={{
          legend: 'Minutes Flying',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        nodeSize={{
          key: 'data.y',
          values: [0, 180],
          sizes: [4, 20],
        }}
        margin={{
          bottom: 50,
          top: 30,
          left: 50,
          right: 30,
        }}
        annotations={[
          {
            type: 'rect',
            match: {
              serieId: highlighted ?? undefined,
            },
            note: '',
            noteX: 0,
            noteY: 0,
            noteWidth: 0,
          },
        ]}
        animate={false}
        tooltip={({ node }) => {
          const flight = node.data.flight;

          return (
            <div
              style={{
                color: node.color,
                backgroundColor: '#333',
              }}
              className="p-1 whitespace-nowrap text-left"
            >
              <div className="font-bold text-center">{node.formattedY}</div>
              <div className="text-sm mb-2">
                {node.formattedX}: {flight.location ?? 'Unknown'}
              </div>
              <div className="whitespace-normal w-[20ch]">
                {flight.commentsTruncated}
              </div>
            </div>
          );
        }}
      />
    </div>
  );

  const legend = data.map((d, i) => {
    const color = colorSchemes.set3[i % colorSchemes.set3.length];
    let backgroundColor = color + (highlighted == d.id ? 'FF' : 'AA');

    return (
      <div
        key={i}
        className="flex m-2 items-center"
        onClick={() => {
          setHighlighted(highlighted ? undefined : d.id);
        }}
        onMouseLeave={() => setHighlighted(undefined)}
        onMouseOver={() => setHighlighted(d.id)}
      >
        <div
          className="inline h-full min-w-5 aspect-square mr-1"
          style={{ backgroundColor: backgroundColor }}
        />
        <div className="">{d.id}</div>
      </div>
    );
  });

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: '1 1 auto' }}>
        <AutoSizer disableHeight>
          {({ width }) => (
            <>
              {chart(width)}
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
