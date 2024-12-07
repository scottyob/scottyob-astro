import type { Climb } from '@libs/Climbing';
import { ResponsiveLine } from '@nivo/line';
import { $climbingFilterStore } from './stores';
import { useStore } from '@nanostores/react';
import { getFilteredData } from './ClimbingDataFilter';

const getDaysClimbedPerMonth = (climbs: Climb[]) => {
  // Days climbed per month
  return climbs
    .reduce((accumulator: { month: string; days: Set<number> }[], climb) => {
      // Extract date from the current climb object
      const { date } = climb;

      // Parse the date and extract the year, month, and day
      const climbDate = new Date(date);
      const year = climbDate.getFullYear();
      const month = climbDate.getMonth() + 1; // month is zero-indexed
      const day = climbDate.getDate();

      // Create a month key in the format "YYYY-MM"
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      // Find or create the entry for this month
      let entry = accumulator.find((entry) => entry.month === monthKey);
      if (!entry) {
        entry = { month: monthKey, days: new Set() };
        accumulator.push(entry);
      }

      // Add the day to the set of days for this month
      entry.days.add(day);

      return accumulator;
    }, [])
    .map((entry) => ({
      month: entry.month,
      daysClimbed: entry.days.size,
    }))

}


export default function ClimbsByMonth(props: { climbs: Climb[] }) {

  // Filter the data given any page filters
  const filters = useStore($climbingFilterStore);
  const climbs = getFilteredData(props.climbs, filters);

  // Get how many days we climbed per month
  const daysClimbedPerMonth = getDaysClimbedPerMonth(climbs);

  // Patch in those from the unfiltered that are now missing with 0 sizes.
  getDaysClimbedPerMonth(props.climbs).forEach((entry) => {
    if(!daysClimbedPerMonth.find((c) => c.month == entry.month)) {
      daysClimbedPerMonth.push({month: entry.month, daysClimbed: 0})
    }
  });

  daysClimbedPerMonth.sort((a, b) => a.month.localeCompare(b.month));  

  const climbsByMonth = [
    {
      id: 'Climbing',
      data: daysClimbedPerMonth.map((c) => ({ x: c.month, y: c.daysClimbed })),
    },
  ];

  return (
    <ResponsiveLine
      data={climbsByMonth}
      margin={{ top: 10, right: 10, bottom: 50, left: 60 }}
      xScale={{ type: 'point' }}
      yScale={{
        type: 'linear',
        min: 'auto',
        max: 'auto',
        stacked: true,
        reverse: false,
      }}
      yFormat=" >-.2f"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 2,
        tickPadding: 5,
        tickRotation: -45,
        // legend: 'Month',
        legendOffset: 50,
        legendPosition: 'middle',
        truncateTickAt: 0,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Days p/Month',
        legendOffset: -40,
        legendPosition: 'middle',
        truncateTickAt: 0,
      }}
      pointSize={10}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      pointLabel="data.yFormatted"
      pointLabelYOffset={-12}
      enableTouchCrosshair={true}
      useMesh={true}
    />
  );
}
