import type { Flight } from '@libs/flying';
import { ScatterPlot } from '@nivo/scatterplot';
import prettyMilliseconds from 'pretty-ms';
import { useState } from 'react';

export type Props = {
  flights: Flight[];
  width: number;
  height: number;
};

function generateData(flights: Flight[]): {
  id: string;
  data: {
    x: string;
    y: number;
  }[];
}[] {
  const data: {
    id: string;
    data: {
      x: string;
      y: number;
    }[];
  }[] = [];

  flights.forEach((flight) => {
    const flightLocation = flight.location ?? "Unknown"

    const existingLocation = data.find((item) => item.id === flightLocation);
    if (existingLocation) {
      existingLocation.data.push({
        x: flight.date,
        y: flight.durationSeconds ? flight.durationSeconds / 60 : 0, // Convert duration from seconds to minutes
      });
    } else {
      data.push({
        id: flightLocation,

        data: [
          {
            x: flight.date,
            y: flight.durationSeconds ? flight.durationSeconds / 60 : 0, // Convert duration from seconds to minutes
          },
        ],
      });
    }
  });

  return data;
}

export default function FlightPlotGraph(props: Props) {
  const [highlighted, setHighlighted] = useState<string | undefined>();

  return (
    <div className="min-h-[400px]">
      <ScatterPlot
        data={generateData(props.flights)}
        height={props.height}
        width={props.width}
        colors={{
          scheme: 'paired',
        }}
        xScale={{
          type: 'time',
          format: '%Y-%m-%d',
          precision: 'day',
        }}
        xFormat="time:%Y-%m-%d"
        yFormat={(duration) => prettyMilliseconds(duration * 60 * 1000, {hideSeconds: true}) }
        axisBottom={{
          format: '%Y-%m',
          tickValues: 'every 6 months',
          tickRotation: -45
        }}
        axisLeft={{
            legend: "Minutes Flying",
            legendPosition: "middle",
            legendOffset: -40
        }}
        nodeSize={{
          key: 'data.y',
          values: [0, 180],
          sizes: [1, 16],
        }}

        margin={{
            bottom: 90, top: 30, left: 50, right: 180
        }}

        annotations={[
          {
            type: 'rect',
            match: {
              serieId: highlighted ?? undefined
            },
            note: "",
            noteX: 0,
            noteY: 0,
            noteWidth: 0,
                        
          }
        ]}
        animate={false}

        legends={[
            {
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 20,
                onMouseEnter: (d) => {
                  setHighlighted(d.label as string);
                },
                onMouseLeave: () => setHighlighted(undefined),
                effects: [
                    {
                        on: 'hover',

                        style: {
                            itemOpacity: 1
                        }
                    }
                ]
            }
        ]}

      />
    </div>
  );
}
