import type { Flight } from '@libs/flying';
import { ResponsiveCalendar, ResponsiveCalendarCanvas } from '@nivo/calendar';

export type Props = {
    flights: Flight[];
};

const logbookStats = (flights: Flight[]) => {
    flights = flights.sort((a, b) => a.date.localeCompare(b.date));
    if (flights.length == 0) {
        throw new Error('Need at least one flight');
    }

    return {
        from: flights[0].date,
        to: flights.at(-1)?.date as string,
        minValue: 1,
        maxValue: 60 * 3, // 3 hours.
        flights: flights,
    };
};

const minutesByDay = (flights: Flight[]) => {
    const ret: { [date: string]: number } = {};
    flights.forEach((f) => {
        const flightDuration = f.durationSeconds ?? 1;
        const minutes = f.date in ret ? ret[f.date] : 0;
        ret[f.date] = minutes + flightDuration / 60.0;
    });
    return Object.entries(ret).map(([date, duration]) => ({
        day: date,
        value: Math.round(duration),
    }));
};

// Returns flights grouped by year
const flightsByYear = (flights: Flight[]): Flight[][] => {
    const byYear: { [year: string]: Flight[] } = {};

    flights.forEach((f) => {
        const year = f.date.substring(0, 4);
        const soFar = byYear[year] ?? [];

        byYear[f.date.substring(0, 4)] = [...soFar, f];
    });
    return Object.values(byYear).sort((a, b) =>
        a[0].date.localeCompare(b[0].date)
    );
};

export default function Calendar(props: Props) {
    // Generate one calendar per year
    const flights = flightsByYear(props.flights).map((flights, i) => {
        const stats = logbookStats(flights);
        // debugger;


        return (
            <div className='h-full'>
                <div className='h-[300px] w-full snap-start' key={i}>
                    <ResponsiveCalendar
                        data={minutesByDay(stats.flights)}
                        from={stats.from}
                        to={stats.to}
                        emptyColor="#eeeeee"
                        colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                        yearSpacing={40}
                        monthBorderColor="#ffffff"
                        dayBorderWidth={2}
                        dayBorderColor="#ffffff"
                        align="top-left"
                        minValue={stats.minValue}
                        maxValue={stats.maxValue}
                        legends={[]}
                    />
                </div>
            </div>
        );
    });

    return <div className="flying-calendar min-w-[375px] w-full overflow-y-scroll snap-both snap-mandatory" style={{aspectRatio: "13 / 02"}}>
        {flights}
    </div>

}
