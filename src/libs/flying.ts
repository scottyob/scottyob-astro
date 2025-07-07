import { google } from 'googleapis';
import IGCParser from 'igc-parser';
import { distanceTo } from 'geolocation-utils';
import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'glob';
import path from 'path';
import fs from 'node:fs';
import matter from 'gray-matter';
import { DateTime } from 'luxon';
import { basename } from 'path';
import { GscWaypoints } from './waypoints';
import type { Flight, FlightIgcFile, Launch, Sites } from './flyingTypes';

// Cache of all the flights in the database
let flights: Flight[] = [];

function truncateComments(comments: string, maxLength: number): string {
  if (comments.length <= maxLength) {
    return comments;
  }

  const truncatedText = comments.substring(0, maxLength);
  const lastSpaceIndex = truncatedText.lastIndexOf(' ');

  if (lastSpaceIndex !== -1) {
    return truncatedText.substring(0, lastSpaceIndex) + '...';
  }

  return truncatedText + '...';
}

// Replaces a location with URL unfriendly names, with friendly ones
function urlFriendlyLocationName(location: string): string {
  const specialCharactersRegex = /[^\w\-./?=&]/g;
  return location.replace(specialCharactersRegex, '-').replaceAll('/', '-');
}

// Gets flights from google docs
async function getSpreadsheetFlights(): Promise<Flight[]> {
  // Authenticate using your credentials
  const auth = new google.auth.GoogleAuth({
    credentials: {
      private_key: Buffer.from(
        import.meta.env.PRIVATE_KEY as string,
        'base64'
      ).toString(),
      client_email: import.meta.env.CLIENT_EMAIL,
      client_id: import.meta.env.CLIENT_ID,
    },
    projectId: import.meta.env.PROJECT_ID,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  // Create a Google Sheets API instance
  const sheets = google.sheets({ version: 'v4', auth: auth });

  // Specify the spreadsheet ID and range of cells you want to retrieve
  const spreadsheetId = '1-rd2b-_l5IgavBxVe50O817AjAbI5qAVc0leU2bxUM8';
  const range = 'Sheet1!A:G';

  // Retrieve the values from the specified range
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  // Extract the values from the response
  const values = response.data.values as string[][];

  // Extract the keys from the first entry
  const keys = values[0];

  // Create a list of objects
  const results = values.slice(1).map((entry, j) => {
    j = j + 2; // Account for index based 0, and the header row
    const obj: Record<string, string> = {};
    keys.forEach((key, index) => {
      obj[key] = entry[index];
    });
    obj['id'] = `g${j}`; // Set the ID to be the record number
    return obj;
  });

  return results.map((r, i) => {
    const date = r['date'] ?? '01-01-1980';
    return {
      id: r.id,
      date: date,
      launchTime: DateTime.fromISO(date).toMillis() + i,
      launch: r.launch,
      durationSeconds: Number(r.durationSeconds ?? 0),
      wing: r.wing,
      fileName: r.fileName,
      comments: r.comment,
      location: r.location,
      locationUrl: urlFriendlyLocationName(r.location),
    };
  });
}

/*
 * Parse an IGC file into a flight record
 */
function parseFile(
  igc: IGCParser.IGCFile,
  launches: Launch[],
  fileInfo: FlightIgcFile,
  rawFile: string
): Flight {
  // Calculate the closest launch (within a 1km margin)
  const launchDistances = launches.map((l) => distanceTo(igc.fixes[0], l));
  const shortestDistance = Math.min(...launchDistances);
  const closestLaunch =
    shortestDistance < 3000
      ? launches[launchDistances.indexOf(shortestDistance)]
      : undefined;

  // Build the flight to return
  return {
    id: fileInfo.fileNameWitoutExtension,
    date: igc.date,
    wing: igc.gliderType!,
    durationSeconds:
      (igc.fixes[igc.fixes.length - 1].timestamp - igc.fixes[0].timestamp) /
      1000,
    maxDistanceMeters: Math.max(
      ...igc.fixes.map((f) => distanceTo(igc.fixes[0], f))
    ),
    maxAltitudeMeters: Math.max(...igc.fixes.map((f) => f.gpsAltitude!)),
    trackLengthMeters: igc.fixes.reduce(
      (previousValue, currentValue, currentIndex) => {
        if (currentIndex === 0) {
          return 0;
        }
        // Work out the distance to the last point
        return (
          previousValue + distanceTo(igc.fixes[currentIndex - 1], currentValue)
        );
      },
      0
    ),
    altitudeGainMeters:
      Math.max(...igc.fixes.map((f) => f.gpsAltitude || 0)) -
      (igc.fixes[0].gpsAltitude || 0),
    launchTime: igc.fixes[0].timestamp,
    waypoints: GscWaypoints(rawFile, igc),
    ...(igc?.task?.comment && { comment: igc?.task?.comment }),
    launch: closestLaunch,
  };
}

/*
 * Replace locations from a file
 */
function replaceLocations(fileName: string, logbook: Flight[]): Flight[] {
  const locations: Sites = JSON.parse(
    readFileSync(fileName, {
      flag: 'r',
      encoding: 'utf8',
    })
  );

  return logbook.map((r) => {
    if (r.location != undefined) {
      return r;
    }

    // Find location name that matches (any really)  Set the flying type
    Object.entries(locations).forEach(([location, locationInfo]) => {
      if (locationInfo.aliases.some((l) => r.launch?.name?.includes(l))) {
        r.location = location;
        r.type = locationInfo.type;
        return;
      }
    });

    if(!r.location) {
      // Default to the launch country
      r.location = r.launch?.country || 'Unknown';
    }

    // If there's a location, set the URL friendly location
    if (r.location) r.locationUrl = urlFriendlyLocationName(r.location);

    return r;
  });
}

/*
 * Gets all flights from gsc files on disk
 */
async function gscFlights(): Promise<Flight[]> {
  // Load up the launches
  let buffer = readFileSync('public/logbook/launches.json', {
    flag: 'r',
    encoding: 'utf8',
  });
  const launches: Launch[] = JSON.parse(buffer);

  const igcs = await glob('public/logbook/flights/**/*.igc', { nocase: true });
  const flights = await Promise.all(
    igcs.map(async (f) => {
      // Load the igc file into memory
      const buffer = readFileSync(f, { flag: 'r', encoding: 'utf8' });
      const igc = IGCParser.parse(buffer);

      const igcFileInfo: FlightIgcFile = {
        filePath: f,
        fileName: basename(f),
        fileNameWitoutExtension: basename(f).split('.')[0],
        filePathUrl: f.replace(/\/?public/, ''),
      };

      let ret = parseFile(igc, launches, igcFileInfo, buffer);
      ret.igcFile = igcFileInfo;

      // Load in the comments from disk
      const igcDirectory = path.dirname(f);
      const commentsFile = path.join(igcDirectory, 'comments.mdx');
      if (fs.existsSync(commentsFile)) {
        const m = matter.read(commentsFile, {
          excerpt: true,
          excerpt_separator: '{/* EXCERPT */}',
        });
        ret.comments = m.excerpt || m.content;
        ret.commentsFileName = commentsFile;
        if (m.data.sportsTrackLiveUrl) {
          ret.sportsTrackLiveUrl = m.data.sportsTrackLiveUrl;
        }
      }

      return ret;
    })
  );

  return replaceLocations('public/logbook/sites.json', flights);
}

/*
 * Builds a cache for all local flights
 */
export async function PopulateFlights() {
  console.log('Pulling flights (...slow)');
  let spreadsheetFlights: Flight[] = [];

  try {
    spreadsheetFlights = await getSpreadsheetFlights();
  } catch (error) {
    console.error(
      'Unable to load flights from spreadsheet.  Carrying on without any.  Check your google auth settings'
    );
  }

  // Build comments and badges
  const igcFlights = await gscFlights();
  flights = [...spreadsheetFlights, ...igcFlights];
  flights.sort((a, b) => a.launchTime - b.launchTime);
  flights.forEach(async (f, i) => {
    f.number = i + 1;
    if (f.comments !== undefined) {
      f.commentsTruncated = truncateComments(f.comments, 100);
    }
  });
  // Sort from most recent first
  flights = flights.reverse();
}

// Gets, caches, and returns flights
export async function GetFlights(): Promise<Flight[]> {
  if (flights.length == 0) {
    // Check if we can load it up from disk
    if (fs.existsSync('./flights.json')) {
      flights = JSON.parse(readFileSync('./flights.json', 'utf-8'));
    } else {
      await PopulateFlights();
    }
  }
  return flights;
}

/*
 * Builds a local flight database
 */
export async function DownloadFlights() {
  // Populate the flight database
  await PopulateFlights();

  writeFileSync('./flights.json', JSON.stringify(flights));
}
