import { useState } from 'react';
// Assuming FlightCard is your flight card component
import FlightCard from './FlightCard';
import type { Flight } from '@libs/flyingTypes';

export type Props = {
  flights: Flight[];
  itemsPerPage?: number;
};
import { FcDataSheet } from "react-icons/fc";


type SortOrder =
  | 'Recent'
  | 'Duration'
  | 'Altitude Gain'
  | 'Maximum Altitude'
  | 'Maximum Distance';

function SorterSelect(props: {
  sorter: SortOrder;
  setSorter: (value: SortOrder) => void;
}) {
  const { sorter, setSorter } = props;

  return (
    <div className="p-2">
      <label className="mb-2 inline mr-2">
        Sort by:
      </label>
      <select
        value={sorter}
        onChange={(e) => setSorter(e.target.value as SortOrder)}
        className="bg-orange-200 p-2 rounded-md focus:ring-2 focus:ring-orange-500"
      >
        <option value="Recent">Recent</option>
        <option value="Duration">Duration</option>
        <option value="Altitude Gain">Altitude Gain</option>
        <option value="Maximum Altitude">Maximum Altitude</option>
        <option value="Maximum Distance">Maximum Distance</option>
      </select>
    </div>
  );
}

export default function FlightCardList(props: Props) {
  const { flights } = props;
  const itemsPerPage = props.itemsPerPage ?? 10;

  // Keep track of how we're sorting the items
  const [sorter, setSorter] = useState<SortOrder>('Recent');

  // State to keep track of the current page
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate total pages
  const totalPages = Math.ceil(flights.length / itemsPerPage);

  // Handler functions for pagination
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const setAndClear = (sorter: SortOrder) => {
    setSorter(sorter);
    setCurrentPage(1);
  };

  // Sort flights by the sorter
  let sortedFlights = flights;
  switch (sorter) {
    case 'Altitude Gain':
      sortedFlights = [...flights].sort(
        (a, b) => (b.altitudeGainMeters ?? 0) - (a.altitudeGainMeters ?? 0)
      );
      break;
    case 'Duration':
      sortedFlights = [...flights].sort(
        (a, b) => (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0)
      );
      break;
    case 'Maximum Altitude':
      sortedFlights = [...flights].sort(
        (a, b) => (b.maxAltitudeMeters ?? 0) - (a.maxAltitudeMeters ?? 0)
      );
      break;
    case 'Maximum Distance':
      sortedFlights = [...flights].sort(
        (a, b) => (b.maxDistanceMeters ?? 0) - (a.maxDistanceMeters ?? 0)
      );
      break;
  }

  // Determine which flights to display on current page
  const currentFlights = sortedFlights.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  //Pager
  const pager = (
    <div>
      <button
        onClick={goToPreviousPage}
        disabled={currentPage === 1}
        className="text-2xl text-orange-600"
      >
        {'<'}
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={goToNextPage}
        disabled={currentPage === totalPages}
        className="text-2xl text-orange-600"
      >
        {'>'}
      </button>
    </div>
  );
  // Sorters
  const sorters = (
    <div className="flex flex-wrap grow min-h-9 space-x-4 items-center justify-center">
      <div>
        <a href="/flying/sheet">
        <FcDataSheet className='inline' />
        Sheet View
      </a></div>
      <SorterSelect sorter={sorter} setSorter={setAndClear} />
      <div className="text-right mr-16">{pager}</div>
    </div>
  );

  return (
    <div>
      {sorters}
      <div>
        {currentFlights.map((flight) => (
          <FlightCard key={flight.number as number} flight={flight} />
        ))}
      </div>
      {pager}
    </div>
  );
}
