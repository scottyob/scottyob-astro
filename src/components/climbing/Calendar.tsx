import { useStore } from '@nanostores/react';
import { $climbingFilterStore, $highlightedDatesStore } from './stores';

import {
  ResponsiveCalendarCanvas,
  type DateOrString,
} from '@nivo/calendar';
import type { Climb } from '@libs/Climbing';
import { getFilteredData } from './ClimbingDataFilter';

export type Props = {
  data: Climb[];
  from: DateOrString; // ex 2023-01-01
  to: DateOrString; // ex 2023-01-01
  minValue: number;
  maxValue: number;
  storeName?: string;
};

const getClimbsByDay = (climbs: Climb[]) => {
  // Climbs by day
  return climbs.reduce(
    (accumulator: { day: string; value: number }[], climb) => {
      // Extract date from the current climb object
      const { date } = climb;

      // Check if an entry for this date already exists in the accumulator
      const existingEntry = accumulator.find((entry) => entry.day === date);

      if (existingEntry) {
        // If an entry exists, increment its value
        existingEntry.value += 1;
      } else {
        // If no entry exists, create a new one with value 1
        accumulator.push({ day: date, value: 1 });
      }

      return accumulator;
    },
    []
  );
};

/*
  Calendar component.

  Uses nanostores to be able to change the highlighted dates from
  outside of this react island.
*/
export default function Calendar(props: Props) {
  // Get a list of highlighted dates
  const store = useStore($highlightedDatesStore);
  let highlightedDates: string[] = [];
  if (props.storeName && Object.keys(store).find((s) => s == props.storeName)) {
    highlightedDates = store[props.storeName];
  }

  // Generate a generally good looking color range between two numbers
  function generateRange(minValue: number, maxValue: number) {
    const rangeLength = maxValue - minValue + 1;
    const startingHue = 180;
    const startingSaturation = 50;
    const startingAlpha = 0.4;
    const hueIncrement = (360 - 180) / (rangeLength - 1);
    const saturationIncrement = (100 - 50) / (rangeLength - 1);
    const alphaIncrement = (1 - 0.3) / (rangeLength - 1);
    const result = [];

    for (let i = 0; i < rangeLength; i++) {
      const hue = startingHue + i * hueIncrement;
      const saturation = startingSaturation + i * saturationIncrement;
      const alpha = startingAlpha + i * alphaIncrement;

      result.push(
        `hsla(${Math.round(hue)} ${Math.round(
          saturation
        )}% 75% / ${alpha.toFixed(2)})`
      );
    }
    return result;
  }
  let colors = generateRange(props.minValue, props.maxValue);
  colors[0] = '#fc7e0f33'; // Highlight color

  // Load up climb with any data filters
  const filters = useStore($climbingFilterStore);
  const climbsByDay = getClimbsByDay(getFilteredData(props.data, filters));
  const existingDates = climbsByDay.map((d) => d.day);
  const daysToHighlight = highlightedDates.filter(
    (d) => !existingDates.find((x) => x == d)
  );
  const data = [
    ...daysToHighlight.map((d) => ({ day: d, value: 0 })),
    ...climbsByDay,
  ];

  return (
    <ResponsiveCalendarCanvas
      data={data}
      from={props.from}
      to={props.to}
      emptyColor="#eeeeee"
      colors={colors}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      yearSpacing={40}
      monthBorderColor="#ffffff"
      dayBorderWidth={2}
      dayBorderColor="#ffffff"
      align="top-left"
      minValue={props.minValue}
      maxValue={props.maxValue}
      legends={[]}
    />
  );
}
