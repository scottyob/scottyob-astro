import type { Waypoint } from "./waypoints";

export interface FlightIgcFile {
    fileName: string; // eg. someIgcFile.igc
    fileNameWitoutExtension: string; // eg. someIgcFile
    filePath: string; // eg.  ./public/logbook/flights/someIgc/someIgcFile.igc
    filePathUrl: string; // eg.  /logbook/flights/someIgc/someIgcFile.igc
  }

  /*
   * A launch or landing site, as pulled from the paragliding launches database
   */
  export type Launch = {
    name: string;
    longitude: number;
    latitude: number;
    country: string;
  };
  
  
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
    commentsFileName?: string;
    sportsTrackLiveUrl?: string;
  
    /*
     * Additional information from launch database (or manual CSV)
     */
    location?: string;
    locationUrl?: string;
    launch?: Launch;
    type?: "thermal" | "ridge";
  
    /*
     * Computed fields
     */
    number?: number; // The record number of the flight
    launchTime: number; //Timestamp, useful for orderinhg and sequence
    waypoints?: Waypoint[];
  }

  /*
   * A collection of sites from the paragliding sites.json file:w
   */
  export type Sites = {
    [key: string]: {
      aliases: string[];
      type: "ridge" | "thermal";
    };
  }