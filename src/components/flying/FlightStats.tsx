import type { Flight } from '@libs/flyingTypes';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Duration } from 'luxon';
import {
  FaCalendarAlt,
  FaClock,
  FaWind,
  FaArrowsAltH,
  FaMountain,
  FaArrowUp,
  FaRoute,
  FaMapMarkerAlt,
  FaPlayCircle,
  FaExternalLinkAlt,
  FaGlobeAmericas,
  FaDownload,
} from 'react-icons/fa';
import type { IconType } from 'react-icons';

type UnitMode = 'mixed' | 'imperial' | 'metric';

type StatProps = {
  icon: IconType;
  value: ReactNode;
  unit?: string;
  label: string;
};

function Stat({ icon: Icon, value, unit, label }: StatProps) {
  return (
    <div className="flex flex-col py-1 px-1.5 sm:py-2 sm:px-4">
      <div className="flex items-baseline gap-0.5 sm:gap-1">
        <Icon className="text-orange-400 text-sm sm:text-lg self-center flex-shrink-0" />
        {typeof value === 'string'
          ? <span className="text-xs sm:text-base font-semibold text-gray-800 leading-none">{value}</span>
          : value}
        {unit && <span className="text-[9px] sm:text-xs text-gray-400">{unit}</span>}
      </div>
      <div className="text-[9px] sm:text-[11px] text-gray-400 uppercase tracking-wide mt-0.5 pl-[18px] sm:pl-[26px]">{label}</div>
    </div>
  );
}

type LinkItemProps = {
  icon: IconType;
  label: string;
  description: string;
  href: string;
  external?: boolean;
};

function LinkItem({ icon: Icon, label, description, href, external }: LinkItemProps) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex flex-col items-center gap-0.5 px-1 py-2 sm:px-3 sm:py-3 text-center hover:bg-orange-50 transition-colors no-underline"
    >
      <Icon className="text-orange-400 text-lg sm:text-xl" />
      <span className="text-[10px] sm:text-xs font-semibold text-gray-700 break-words w-full">{label}</span>
      <span className="text-[9px] sm:text-[10px] text-gray-400 leading-tight">{description}</span>
    </a>
  );
}

function MountainUpIcon({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-end gap-[1px] ${className ?? ''}`}>
      <FaArrowUp style={{ fontSize: '0.6em', position: 'relative', top: '-6px', left: '4px', transform: 'rotate(45deg)' }} />
      <FaMountain />
    </span>
  );
}

function UnitToggle({ value, onChange }: { value: UnitMode; onChange: (m: UnitMode) => void }) {
  const modes: UnitMode[] = ['mixed', 'imperial', 'metric'];
  return (
    <div className="flex rounded border border-gray-200 overflow-hidden">
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`px-2 py-0.5 text-[10px] font-semibold capitalize transition-colors ${
            value === mode
              ? 'bg-orange-400 text-white'
              : 'bg-white text-gray-400 hover:text-gray-600'
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

export default function FlightStats({ flight }: { flight: Flight }) {
  const [units, setUnits] = useState<UnitMode>('mixed');

  const durationStr = Duration.fromMillis((flight.durationSeconds || 0) * 1000).toFormat("h'h' m'm'");

  const imperialAlt = units !== 'metric';
  const imperialDist = units === 'imperial';

  const fmtAlt = (m: number) =>
    imperialAlt ? Math.round(m * 3.28084).toLocaleString() : Math.round(m).toLocaleString();
  const altUnit = imperialAlt ? 'ft' : 'm';

  const fmtDist = (m: number) =>
    imperialDist ? (m / 1609.344).toFixed(1) : (m / 1000).toFixed(1);
  const distUnit = imperialDist ? 'mi' : 'km';

  const wingUrl = flight.wing ? `/flying/wing/${flight.wing.replaceAll(' ', '-')}` : null;
  const locationUrl = flight.location ? `/flying/site/${flight.location.replaceAll(' ', '-')}` : null;

  const wingValue = wingUrl
    ? <a href={wingUrl} className="text-xs sm:text-base font-semibold text-orange-500 hover:underline leading-none">{flight.wing}</a>
    : <span className="text-xs sm:text-base font-semibold text-gray-800 leading-none">{flight.wing ?? '—'}</span>;

  const locationValue = locationUrl
    ? <a href={locationUrl} className="text-xs sm:text-base font-semibold text-orange-500 hover:underline leading-none">{flight.location}</a>
    : <span className="text-xs sm:text-base font-semibold text-gray-800 leading-none">{flight.location ?? flight.launch?.name ?? '—'}</span>;

  const stats: StatProps[] = [
    { icon: FaCalendarAlt,        value: flight.date,                                           label: 'Date' },
    { icon: FaClock,              value: durationStr,                                           label: 'Duration' },
    { icon: FaWind,               value: wingValue,                                             label: 'Wing' },
    { icon: FaArrowsAltH,         value: fmtDist(flight.maxDistanceMeters ?? 0), unit: distUnit, label: 'Max Distance' },
    { icon: FaMountain,           value: fmtAlt(flight.maxAltitudeMeters ?? 0),  unit: altUnit,  label: 'Max Altitude' },
    { icon: MountainUpIcon as any, value: fmtAlt(flight.altitudeGainMeters ?? 0), unit: altUnit, label: 'Launch Gain' },
    { icon: FaArrowUp,            value: fmtAlt(flight.totalAltitudeGainMeters ?? 0), unit: altUnit, label: 'Altitude Gain' },
    { icon: FaRoute,              value: fmtDist(flight.trackLengthMeters ?? 0), unit: distUnit, label: 'Track Length' },
    { icon: FaMapMarkerAlt,       value: locationValue,                                         label: 'Location' },
  ];

  const igcUrl = flight.igcFile
    ? `/${flight.igcFile.filePath.replace(/^public\//, '')}`
    : null;
  const flightUrl = flight.igcFile
    ? `https://www.scottyob.com/${flight.igcFile.filePath.replace(/^public\//, '')}`
    : null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Stats header with unit toggle */}
      <div className="px-4 pt-2.5 pb-1.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Key Statistics</span>
        <UnitToggle value={units} onChange={setUnits} />
      </div>

      <div className="grid grid-cols-3 divide-x divide-y divide-gray-100">
        {stats.map((s) => (
          <Stat key={s.label} {...s} />
        ))}
      </div>

      {/* Links section */}
      <div className="border-t border-gray-100">
        <div className="px-4 pt-3 pb-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">View Flight</span>
        </div>
        <div className="grid divide-x divide-gray-100" style={{ gridTemplateColumns: `repeat(${[true, !!flight.sportsTrackLiveUrl, !!flightUrl, !!igcUrl].filter(Boolean).length}, minmax(0, 1fr))` }}>
          <LinkItem icon={FaPlayCircle}      label="Replay"          description="Replay with tasks"       href={`/flying/replay/${flight.id}`} />
          {flight.sportsTrackLiveUrl && (
            <LinkItem icon={FaExternalLinkAlt} label="SportsTrackLive" description="View flying with others!" href={flight.sportsTrackLiveUrl} external />
          )}
          {flightUrl && (
            <LinkItem icon={FaGlobeAmericas} label="replay.flights"  description="All of the stats"       href={`https://replay.flights?files=${flightUrl}`} external />
          )}
          {igcUrl && (
            <LinkItem icon={FaDownload}      label="IGC File"        description="Download raw track"      href={igcUrl} />
          )}
        </div>
      </div>
    </div>
  );
}
