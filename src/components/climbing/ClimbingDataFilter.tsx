import type { Climb } from '@libs/Climbing';
import { useStore } from '@nanostores/react';
import { atom, type WritableAtom } from 'nanostores';
import type React from 'react';
import { useState } from 'react';
import { $climbingFilterStore, type Filter, type FilterStore } from './stores';


// Returns filtered climbs
export function getFilteredData(data: Climb[], filters: FilterStore) {
  let ret = data;
  filters.forEach((f) => {
    ret = f.filter(ret);
  })
  return ret;
}

export type Props = {
  dataFilter: "Hard Boulders" | "Project Climbs?";
  name?: string;
  children?: React.ReactNode;
};

export default function DataFilter(props: Props) {
  const name = props.name || props.dataFilter;
  let dataFilter = (data: Climb[]) => data;
  switch (props.dataFilter) {
    case "Hard Boulders":
      dataFilter = (data) => data.filter((x) => ["V4", "V5"].includes(x.rating));
      break;
    case "Project Climbs?":
      dataFilter = (data) => data.filter((x) => x.rating.startsWith('5.11') || x.rating.startsWith('5.12'));
      break;
  }

  const store = useStore($climbingFilterStore);
  const applied =
    store.find((filter) => filter.name == name) != undefined;

  const remove = () => {
    const newStore = store.filter((filter) => filter.name != name);
    $climbingFilterStore.set(newStore);
  };

  const apply = () => {
    $climbingFilterStore.set([...store, { name: name, filter: dataFilter }]);
  };

  // Clicking will toggle on and off.
  const [ toggled, setToggled ] = useState(false);

  return (
    <span
      data-filter
      data-applied={applied}
      onClick={() => {
        // We want to toggle the filter
        setToggled(!toggled)
        if (!toggled) {
          apply();
        } else {
          remove();
        }
      }}
      onMouseEnter={() => !toggled && apply()}
      onMouseLeave={() => !toggled && remove()}
    >
      {props.children || name}
    </span>
  );
}
