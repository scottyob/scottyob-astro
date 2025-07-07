import { useEffect, useState } from 'react';
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

  // Read initial page from URL if available
  const getInitialPage = () => {
    if (typeof window !== "undefined") {
      const params = new URL(window.location.href).searchParams;
      const page = parseInt(params.get("page") || "1", 10);
      return isNaN(page) || page < 1 ? 1 : page;
    }
    return 1;
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const page = getInitialPage();
      setCurrentPageState(page);
      console.log("Back/forward navigation detected", window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);


  // Keep track of how we're sorting the items
  const [sorter, setSorter] = useState<SortOrder>('Recent');

  // State to keep track of the current page
  const [currentPage, setCurrentPageState] = useState(getInitialPage());

  // Calculate total pages
  const totalPages = Math.ceil(flights.length / itemsPerPage);

  const setCurrentPage = (page: number) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPageState(page);

    // Update the URL with the current page number
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.toString());
    window.history.pushState({}, '', url);
  };

  // Handler functions for pagination
  const goToPreviousPage = () => {
    setCurrentPage(Math.max(currentPage - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(Math.min(currentPage + 1, totalPages));
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
      <a
        href="#flightList"
        onClick={goToPreviousPage}
        className={"text-2xl text-orange-600 no-underline" + (currentPage === 1 ? ' opacity-50 cursor-not-allowed' : '')}
      >
        {'<'}
      </a>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <a
        href="#flightList"
        onClick={goToNextPage}
        className={"text-2xl text-orange-600 no-underline" + (currentPage === totalPages ? ' opacity-50 cursor-not-allowed' : '')}
      >
        {'>'}
      </a>
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
      <div id="flightList">
        {currentFlights.map((flight) => (
          <FlightCard key={flight.number as number} flight={flight} />
        ))}
      </div>
      {pager}
    </div>
  );
}
