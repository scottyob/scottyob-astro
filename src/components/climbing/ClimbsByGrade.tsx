import type { Climb } from '@libs/Climbing';
import { ResponsiveLine } from '@nivo/line';
import { $climbingFilterStore } from './stores';
import { useStore } from '@nanostores/react';
import { getFilteredData } from './ClimbingDataFilter';

const getMonthKey = (date: string) => date.slice(0, 7);

const getMonthlyClimbsByGrade = (climbs: Climb[], allMonths: string[]) => {

    return Object.entries(
        climbs.reduce(
            (
                accumulator: { [month: string]: { [level: string]: number } },
                climb
            ) => {
                const monthKey = getMonthKey(climb.date);

                if (!(climb.rating in accumulator)) {
                    let monthTally: {[key: string]: number} = {};
                    Array.from(allMonths).forEach((x) => {monthTally[x] = 0})
                    accumulator[climb.rating] = monthTally;
                }
                accumulator[climb.rating][monthKey] += 1;

                return accumulator;
            },
            {}
        )
    ).map(([grade, monthKey]) => ({
        id: grade,
        data: Object.entries(monthKey).map(([month, climbs]) => ({
            x: month,
            y: climbs,
        })).sort((a, b) => a.x.localeCompare(b.x)),
    }));
};

export default function ClimbsByGrade(props: { climbs: Climb[] }) {
    // Filter the data given any page filters
    const filters = useStore($climbingFilterStore);
    const climbs = getFilteredData(props.climbs, filters);
    const allMonths = Array.from(new Set(props.climbs.map((c) => getMonthKey(c.date))));

    return (
        <ResponsiveLine
            animate
            curve="monotoneX"
            data={getMonthlyClimbsByGrade(climbs, allMonths)}
            enableSlices="x"
            enableTouchCrosshair
            legends={[
                {
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    toggleSerie: true,
                    symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [
                        {
                            on: 'hover',
                            style: {
                                itemBackground: 'rgba(0, 0, 0, .03)',
                                itemOpacity: 1,
                            },
                        },
                    ],
                },
            ]}
            margin={{
                bottom: 60,
                left: 80,
                right: 100,
                top: 20,
            }}
            yScale={{
                stacked: false,
                type: 'linear',
            }}
            axisBottom={{
                tickRotation: -45,
            }}
        />
    );
}
