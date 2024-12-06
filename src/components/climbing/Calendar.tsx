import { useStore } from '@nanostores/react';
import { $highlightedDatesStore } from './stores';

import {
  ResponsiveCalendar,
  type CalendarDatum,
  type DateOrString,
} from '@nivo/calendar';
import { useEffect } from 'react';

export type Props = {
  data: CalendarDatum[];
  from: DateOrString; // ex 2023-01-01
  to: DateOrString; // ex 2023-01-01
  minValue: number;
  maxValue: number;
  storeName?: string;
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

  const existingDates = props.data.map((d) => d.day);
  const daysToHighlight = highlightedDates.filter(d => !existingDates.find(x => x == d));
  const data = [
    ...daysToHighlight.map(d => ({day: d, value: 0})), ...props.data
  ]

  console.log("Days to highlight: ", daysToHighlight);
  console.log("Rendering!!!", data);
  return (
    <ResponsiveCalendar
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
      legends={[
        {
          anchor: 'bottom-right',
          direction: 'row',
          translateY: 36,
          itemCount: 4,
          itemWidth: 42,
          itemHeight: 36,
          itemsSpacing: 14,
          itemDirection: 'right-to-left',
        },
      ]}
    />
  );
}
