import type { Flight } from '@libs/flyingTypes';
import FlightPreview from './FlightPreview';
import prettyMilliseconds from 'pretty-ms';

type Props = {
  flight: Flight;
};

const HEIGHT = 120;
const BORDER_WIDTH = 8;

const StatStyles = 'text-orange-500';
type Format = 'meters' | 'feet';

import './FlightCard.css';
import FlightTaskProgress from './FlightTaskProgress';

const s = (stat: string | number | undefined, format?: Format, to?: Format) => {
  let ret = stat;
  const formatter = new Intl.NumberFormat('un-US', {
    maximumFractionDigits: 2,
  });

  // Handle undefined use cases.
  if (stat == undefined) {
    return <span className={StatStyles}>N/A</span>;
  }

  switch (format) {
    case 'meters':
      if (to == 'feet') {
        ret = formatter.format(3.28084 * (stat as number));
        ret += 'ft';
        break;
      }

      // Assume we just want this in an easy to read format.
      let suffix = 'm';
      if ((stat as number) > 999) {
        stat = (stat as number) / 1000;
        suffix = 'km';
      }
      ret = formatter.format(stat as number) + suffix;
      break;

    default:
      break;
  }
  return <span className={StatStyles}>{ret}</span>;
};

export default function FlightCard(props: Props) {
  const { flight } = props;

  return (
    <div className="w-full p-8 text-left border-b last:border-none border-gray-200 flex flex-wrap">
      {/* Left hand flight preview & picture */}
      <a target='_blank' href={`/flying/flight/${flight.id.toString()}`} className="p-4 m-4 text-center ml-auto mr-auto">
        <div
          style={{ height: HEIGHT, borderWidth: BORDER_WIDTH, }}
          className={`border-gray-400 bg-white border-8 aspect-video rotate-12`}
        / >
        <div
          style={{ height: HEIGHT, borderWidth: BORDER_WIDTH, top: -1 * HEIGHT, marginBottom: -1 * HEIGHT }}
          className={`border-gray-400 bg-white border-8 aspect-video relative`}
        >
          <FlightPreview flight={flight} height={HEIGHT - BORDER_WIDTH * 2} />
        </div>
        <div className="text-center">#{flight.number}</div>
      </a>
      {/* Stats */}
      <div className="w-0 min-w-[20ch] max-w-[40ch] grow m-4">
        {s(flight.date)}: Flight from <a href={`/flying/site/${flight.location?.replaceAll(" ", "-")}`}>{s(flight.location)}</a> took{' '}
        {s(
          flight.durationSeconds && prettyMilliseconds(flight.durationSeconds * 1000, {
            hideSeconds: true,
            verbose: true,
          })
        )}
        . The altitude gain was {s(flight.altitudeGainMeters, 'meters', 'feet')}
        , reaching a max altitude of{' '}
        {s(flight.maxAltitudeMeters, 'meters', 'feet')}. The flight was on a{' '}
        <a href={`/flying/wing/${flight.wing?.replaceAll(" ", "-")}`}>{s(flight.wing)}</a> wing, covering a max distance of{' '}
        {s(flight.maxDistanceMeters, 'meters')}. <FlightTaskProgress flight={flight} />
      </div>
      {/* Writeup */}
      <div className="w-0 min-w-[20ch] grow m-4 flight-writeup-summary">
        <div className="max-w-[70ch]">
          {flight.excerpt && (<div dangerouslySetInnerHTML={{ __html: flight.excerpt}}></div>)}
        </div>
      </div>
    </div>
  );
}
