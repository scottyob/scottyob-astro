import type { Waypoint } from "./waypoints";

export interface FlightIgcFile {
    fileName: string; // eg. someIgcFile.igc
    fileNameWitoutExtension: string; // eg. someIgcFile
    filePath: string; // eg.  ./public/logbook/flights/someIgc/someIgcFile.igc
    filePathUrl: string; // eg.  /logbook/flights/someIgc/someIgcFile.igc
  }
  
  export interface Flight {
    id: string; // Going to be either the IGC file name, or the google record number
    date: string;
    wing?: string;
    durationSeconds?: number;
    maxDistanceMeters?: number;
    maxAltitudeMeters?: number;
    trackLengthMeters?: number;
    altitudeGainMeters?: number;
    igcFile?: FlightIgcFile;
    comments?: string;
    commentsTruncated?: string;
    excerpt?: string;
    commentsFileName?: string;
    sportsTrackLiveUrl?: string;
  
    /*
     * Additional information from launch database (or manual CSV)
     */
    location?: string;
    locationUrl?: string;
    launchName?: string;
  
    /*
     * Computed fields
     */
    number?: number; // The record number of the flight
    launchTime: number; //Timestamp, useful for orderinhg and sequence
    waypoints?: Waypoint[];
  }
  
  /*
   * A launch or landing site, as pulled from the paragliding launches database
   */
  export type Launch = {
    name: string;
    longitude: number;
    latitude: number;
  };
  