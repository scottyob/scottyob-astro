import type { Flight } from '@libs/flyingTypes';
import { ScatterPlot } from '@nivo/scatterplot';
import prettyMilliseconds from 'pretty-ms';
import { useLayoutEffect, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { colorSchemes } from '@nivo/colors';
import { useStore } from '@nanostores/react';
import { $siteFilter } from '@libs/flightFilterStore';

type CardFlight = { flight: Flight; x: number; y: number };

function FlightCard({
  flight,
  x,
  y,
  interactive,
}: {
  flight: Flight;
  x: number;
  y: number;
  interactive: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.style.transform = '';
    const cardRect = ref.current.getBoundingClientRect();
    const overRight = cardRect.right - window.innerWidth + 24;
    const overBottom = cardRect.bottom - window.innerHeight + 8;
    const tx = overRight > 0 ? -overRight : 0;
    const ty = overBottom > 0 ? -overBottom : 0;
    if (tx !== 0 || ty !== 0) {
      ref.current.style.transform = `translate(${tx}px, ${ty}px)`;
    }
  }, [x, y]);

  const flightUrl = `/flying/flight/${flight.id}`;
  const duration = flight.durationSeconds
    ? prettyMilliseconds(flight.durationSeconds * 1000, { hideSeconds: true })
    : undefined;

  return (
    <div
      ref={ref}
      style={{ position: 'absolute', left: x, top: y, zIndex: 100, backgroundColor: '#333' }}
      className={`text-white p-2 rounded shadow-lg text-left ${interactive ? '' : 'pointer-events-none'}`}
      onClick={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
    >
      <a
        href={flightUrl}
        target="_blank"
        className="font-bold text-center block text-blue-300 hover:underline"
      >
        {duration}
      </a>
      <div className="text-sm mb-2">{flight.date}: {flight.location ?? 'Unknown'}</div>
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
  const pinnedHighlight = useStore($siteFilter);
  const [hoverHighlight, setHoverHighlight] = useState<string | undefined>();
  const highlighted = pinnedHighlight ?? hoverHighlight;
  const [pinnedFlight, setPinnedFlightState] = useState<CardFlight | null>(null);
  const [hoveredFlight, setHoveredFlight] = useState<CardFlight | null>(null);
  const pinnedRef = useRef<CardFlight | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastPointerRef = useRef({ x: 0, y: 0 });

  const supportsHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
  // Set to true by nivo's onMouseMove before the event bubbles to the wrapper div.
  // Wrapper checks this flag: if set, we're over a circle (don't clear hover); if not, we're on empty space.
  const nivoMovedRef = useRef(false);

  const setPinnedFlight = (pf: CardFlight | null) => {
    pinnedRef.current = pf;
    setPinnedFlightState(pf);
  };

  const data = generateData(props.flights);
  // Stable color map keyed by series id so reordering doesn't shift colors
  const colorById = Object.fromEntries(
    data.map((d, i) => [d.id, colorSchemes.set3[i % colorSchemes.set3.length]])
  );
  // Render highlighted series last so its dots paint on top of others
  const orderedData = highlighted
    ? [...data.filter((d) => d.id !== highlighted), ...data.filter((d) => d.id === highlighted)]
    : data;
  const displayedFlight = pinnedFlight ?? hoveredFlight;

  const chart = (width: number) => (
    <div
      ref={wrapperRef}
      className="min-h-[400px] [&_circle]:cursor-pointer [&_rect]:pointer-events-none relative"
      onMouseMove={(e) => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        lastPointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        if (supportsHover && !pinnedRef.current) {
          if (nivoMovedRef.current) {
            nivoMovedRef.current = false;
          } else {
            setHoveredFlight(null);
          }
        }
      }}
      onMouseLeave={() => {
        if (supportsHover && !pinnedRef.current) setHoveredFlight(null);
      }}
      onPointerDown={(e) => {
        if (!wrapperRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        lastPointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }}
      onClick={() => { setPinnedFlight(null); $siteFilter.set(undefined); setHoverHighlight(undefined); }}
    >
      <ScatterPlot
        data={orderedData}
        height={props.height}
        width={width}
        colors={(serie) => colorById[serie.serieId] ?? colorSchemes.set3[0]}
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
            match: { serieId: highlighted ?? undefined },
            note: '',
            noteX: 0,
            noteY: 0,
            noteWidth: 0,
          },
        ]}
        layers={['grid', 'axes', 'annotations', 'nodes', 'markers', 'mesh', 'legends']}
        animate={false}
        useMesh={false}
        tooltip={() => null}
        onClick={({ data }, event) => {
          event.stopPropagation();
          setPinnedFlight({ flight: data.flight, ...lastPointerRef.current });
        }}
        onMouseMove={supportsHover ? (node) => {
          nivoMovedRef.current = true;
          if (pinnedRef.current) return;
          if (pinnedHighlight && node.serieId !== pinnedHighlight) return;
          setHoveredFlight((prev) => {
            if (prev?.flight.id === node.data.flight.id) return prev;
            return { flight: node.data.flight, ...lastPointerRef.current };
          });
        } : undefined}
      />
      {displayedFlight && (
        <FlightCard
          flight={displayedFlight.flight}
          x={displayedFlight.x}
          y={displayedFlight.y}
          interactive={displayedFlight === pinnedFlight}
        />
      )}
    </div>
  );

  const legend = data.map((d, i) => {
    const color = colorById[d.id];
    const isPinned = pinnedHighlight === d.id;
    const backgroundColor = color + (highlighted === d.id ? 'FF' : '88');

    return (
      <div
        key={i}
        className="flex m-2 items-center cursor-pointer select-none"
        onClick={() => $siteFilter.set(isPinned ? undefined : d.id)}
        onMouseEnter={() => { if (!pinnedHighlight) setHoverHighlight(d.id); }}
        onMouseLeave={() => { if (!pinnedHighlight) setHoverHighlight(undefined); }}
      >
        <div
          className={`inline h-full min-w-5 aspect-square mr-1 ${isPinned ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : ''}`}
          style={{ backgroundColor }}
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
