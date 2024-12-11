import type { Flight } from '@libs/flying';
import { Bar } from '@nivo/bar';

export type Props = {
    width: number;
    height: number;
    flights: Flight[];
};

interface Group {
    year: string;
    location: string;
    duration: number;
}

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
        const ret = { year, ...locations };
        return ret;
    });

    console.log(formattedResult);
    return formattedResult;
};

export default function FlightYearGraph(props: Props) {
    const { flights } = props;

    console.log('data', getData(flights));

    return (
        <Bar
            data={getData(flights)}
            width={props.width}
            height={props.height}
            indexBy={'year'}
            colors={{ scheme: "paired" }}
            margin={{
                bottom: 30, top: 30, left: 50, right: 180
            }}
            indexScale={{ type: 'band', round: true }}
            keys={Array.from(new Set(flights.map((f) => f.location || 'Unknown')))}
        legends={[
            {
                dataFrom: 'keys',
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
                toggleSerie: true,
                
            }
        ]}
        labelSkipHeight={20}
        valueFormat={"0.2f"}
        />
    );
}
