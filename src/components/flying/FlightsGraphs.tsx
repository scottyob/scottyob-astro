import type { Flight } from '@libs/flying';
import FlightPlotGraph from './FlightPlotGraph';
import AutoSizer from 'react-virtualized-auto-sizer';
import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';
import tw from 'tailwind-styled-components';
import FlightYearGraph from './FlightYearGraph';

export type Props = {
  flights: Flight[];
};

const SelectedA = tw.a`
  active
  border-b-2
  border-blue-600
  dark:border-blue-500
  dark:text-blue-500
  inline-block
  p-4
  rounded-t-lg
  text-blue-600 
  no-underline
`;

const UnselectedA = tw.a`
  border-b-2
  border-transparent
  dark:hover:text-gray-300
  hover:border-gray-300
  hover:text-gray-600
  inline-block
  p-4
  rounded-t-lg
  no-underline
`;

type TabItemProps = {
  selected: string;
  setSelected: Dispatch<SetStateAction<string>>;
  title: string;
};

function TabItem(props: TabItemProps) {
  const { title } = props;
  const selected = props.selected == props.title;

  return (
    <li className="mr-2">
      {selected && <SelectedA aria-current="page">{title}</SelectedA>}
      {!selected && (
        <UnselectedA onClick={() => props.setSelected(title)}>
          {title}
        </UnselectedA>
      )}
    </li>
  );
}

export default function FlightGraphs(props: Props) {
  const [selected, setSelected] = useState('Flights');
  const graphHeight = 600;

  return (
    <>
      <ul className="flex flex-wrap -mb-px list-none">
        <TabItem
          selected={selected}
          setSelected={setSelected}
          title="Flights"
        />
        <TabItem
          selected={selected}
          setSelected={setSelected}
          title="By Year"
        />
        <TabItem
          selected={selected}
          setSelected={setSelected}
          title="By Location"
        />
        <TabItem selected={selected} setSelected={setSelected} title="Map" />
      </ul>

      <div
        className={` border-gray-200 border-solid border-2 rounded-3xl min-h-[${
          graphHeight + 5
        }px]`}
      >
        <div style={{ display: 'flex' }}>
          <div style={{ flex: '1 1 auto' }}>
            <AutoSizer disableHeight>
              {({ width }) => {
                return (
                  <>
                    {selected == 'Flights' && (
                      <FlightPlotGraph
                        flights={props.flights}
                        width={width}
                        height={graphHeight}
                      />
                    )}
                    {selected == 'By Year' && (
                      <FlightYearGraph
                        flights={props.flights}
                        width={width}
                        height={graphHeight}
                      />
                    )}
                  </>
                );
              }}
            </AutoSizer>
          </div>
        </div>
      </div>
    </>
  );
}
