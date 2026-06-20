import type { Flight } from '@libs/flyingTypes';
import { ScatterPlot } from '@nivo/scatterplot';
import prettyMilliseconds from 'pretty-ms';
import { useLayoutEffect, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { colorSchemes } from '@nivo/colors';

function BoundedTooltip({ color, formattedY, formattedX, flight, mouseX }: {
  color: string; formattedY: string; formattedX: string; flight: Flight; mouseX: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Re-run on every mouseX change. useLayoutEffect fires before paint so
  // there's no visible flash. Reset first so we measure the natural position.
  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.style.transform = '';
    const rect = ref.current.getBoundingClientRect();
    // Walk up to the nearest scrolling container to get its visible right edge,
    // accounting for its scrollbar width.
    let container: Element | null = ref.current.parentElement;
    while (container && getComputedStyle(container).overflowY === 'visible') {
      container = container.parentElement;
    }
    const containerRight = container
      ? container.getBoundingClientRect().left + (container as HTMLElement).clientWidth
      : document.documentElement.clientWidth;
    const overRight = rect.right - containerRight;
    const overTop = -rect.top;
    const tx = overRight > 0 ? -(overRight + 8) : 0;
    const ty = overTop > 0 ? overTop + 8 : 0;
    if (tx !== 0 || ty !== 0) {
      ref.current.style.transform = `translate(${tx}px, ${ty}px)`;
    }
  }, [mouseX]);

  return (
    <div
      ref={ref}
      style={{ color, backgroundColor: '#333' }}
      className="p-1 whitespace-nowrap text-left"
    >
      <div className="font-bold text-center">{formattedY}</div>
      <div className="text-sm mb-2">{formattedX}: {flight.location ?? 'Unknown'}</div>
      <div className="whitespace-normal w-[20ch]">{flight.commentsTruncated}</div>
    </div>
  );
}

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
  const [mouseX, setMouseX] = useState(0);

  const data = generateData(props.flights);

  const chart = (width: number) => (
    <div className="min-h-[400px] [&_circle]:cursor-pointer" onMouseMove={(e) => setMouseX(e.clientX)}>
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
        onClick={({ data }) => window.open(`/flying/flight/${data.flight.id}`, '_blank')}
        tooltip={({ node }) => (
          <BoundedTooltip
            color={node.color}
            formattedY={node.formattedY}
            formattedX={node.formattedX}
            flight={node.data.flight}
            mouseX={mouseX}
          />
        )}
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
