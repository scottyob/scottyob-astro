import { useEffect, useState } from 'react';
import FlightCard from './FlightCard';
import type { Flight } from '@libs/flyingTypes';
import { FcDataSheet } from "react-icons/fc";
import { FiFilter } from "react-icons/fi";
import { useStore } from '@nanostores/react';
import { $siteFilter, $yearFilter, $wingFilter } from '@libs/flightFilterStore';

export type Props = {
  flights: Flight[];
  itemsPerPage?: number;
};

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
      <label className="mb-2 inline mr-2">Sort by:</label>
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

  const siteFilter = useStore($siteFilter);
  const yearFilter = useStore($yearFilter);
  const wingFilter = useStore($wingFilter);

  const getInitialPage = () => {
    if (typeof window !== "undefined") {
      const params = new URL(window.location.href).searchParams;
      const page = parseInt(params.get("page") || "1", 10);
      return isNaN(page) || page < 1 ? 1 : page;
    }
    return 1;
  };

  useEffect(() => {
    const handlePopState = () => setCurrentPageState(getInitialPage());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Reset to page 1 when any filter changes
  useEffect(() => { setCurrentPageState(1); }, [siteFilter]);
  useEffect(() => { setCurrentPageState(1); }, [yearFilter]);
  useEffect(() => { setCurrentPageState(1); }, [wingFilter]);

  const [sorter, setSorter] = useState<SortOrder>('Recent');
  const [currentPage, setCurrentPageState] = useState(getInitialPage());

  // Apply filters
  let filteredFlights = siteFilter
    ? flights.filter((f) => f.location === siteFilter)
    : flights;
  if (yearFilter) filteredFlights = filteredFlights.filter((f) => f.date.startsWith(yearFilter));
  if (wingFilter) filteredFlights = filteredFlights.filter((f) => f.wing === wingFilter);

  const totalPages = Math.ceil(filteredFlights.length / itemsPerPage);

  const setCurrentPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPageState(page);
    const url = new URL(window.location.href);
    url.searchParams.set("page", page.toString());
    window.history.pushState({}, '', url);
  };

  const goToPreviousPage = () => setCurrentPage(Math.max(currentPage - 1, 1));
  const goToNextPage = () => setCurrentPage(Math.min(currentPage + 1, totalPages));
  const setAndClear = (s: SortOrder) => { setSorter(s); setCurrentPage(1); };

  // Sort
  let sortedFlights = filteredFlights;
  switch (sorter) {
    case 'Altitude Gain':
      sortedFlights = [...filteredFlights].sort((a, b) => (b.altitudeGainMeters ?? 0) - (a.altitudeGainMeters ?? 0));
      break;
    case 'Duration':
      sortedFlights = [...filteredFlights].sort((a, b) => (b.durationSeconds ?? 0) - (a.durationSeconds ?? 0));
      break;
    case 'Maximum Altitude':
      sortedFlights = [...filteredFlights].sort((a, b) => (b.maxAltitudeMeters ?? 0) - (a.maxAltitudeMeters ?? 0));
      break;
    case 'Maximum Distance':
      sortedFlights = [...filteredFlights].sort((a, b) => (b.maxDistanceMeters ?? 0) - (a.maxDistanceMeters ?? 0));
      break;
  }

  const currentFlights = sortedFlights.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const pager = (
    <div>
      <a
        href="#flightList"
        onClick={goToPreviousPage}
        className={"text-2xl text-orange-600 no-underline" + (currentPage === 1 ? ' opacity-50 cursor-not-allowed' : '')}
      >
        {'<'}
      </a>
      <span>Page {currentPage} of {totalPages}</span>
      <a
        href="#flightList"
        onClick={goToNextPage}
        className={"text-2xl text-orange-600 no-underline" + (currentPage === totalPages ? ' opacity-50 cursor-not-allowed' : '')}
      >
        {'>'}
      </a>
    </div>
  );

  return (
    <div id="flightList">
      <div className="flex flex-wrap grow min-h-9 space-x-4 items-center justify-center">
        <div>
          <a href="/flying/sheet">
            <FcDataSheet className='inline' />
            Sheet View
          </a>
        </div>
        <SorterSelect sorter={sorter} setSorter={setAndClear} />
        <div className="text-right mr-16">{pager}</div>
      </div>
      {(siteFilter || yearFilter || wingFilter) && (
        <div className="flex items-center gap-2 px-4 py-1 text-sm text-orange-600">
          <FiFilter className="inline shrink-0" />
          <span>Filters:</span>
          {siteFilter && (
            <>
              <span className="font-semibold">{siteFilter}</span>
              <button onClick={() => $siteFilter.set(undefined)} className="font-bold leading-none hover:text-orange-400" aria-label="Remove site filter">×</button>
            </>
          )}
          {yearFilter && (
            <>
              <span className="font-semibold">{yearFilter}</span>
              <button onClick={() => $yearFilter.set(undefined)} className="font-bold leading-none hover:text-orange-400" aria-label="Remove year filter">×</button>
            </>
          )}
          {wingFilter && (
            <>
              <span className="font-semibold">{wingFilter}</span>
              <button onClick={() => $wingFilter.set(undefined)} className="font-bold leading-none hover:text-orange-400" aria-label="Remove wing filter">×</button>
            </>
          )}
          <button
            onClick={() => { $siteFilter.set(undefined); $yearFilter.set(undefined); $wingFilter.set(undefined); }}
            className="ml-2 text-xs underline hover:text-orange-400"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        </div>
      )}
      <div>
        {currentFlights.map((flight) => (
          <FlightCard key={flight.number as number} flight={flight} />
        ))}
      </div>
      {pager}
    </div>
  );
}
