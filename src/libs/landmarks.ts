import { glob } from 'glob';
import { basename, extname } from 'node:path';

/*
 * Gets all landmark files (waypoints, airspace) from the logbook for the igc-viewer
 */
export async function GetLandmarks(): Promise<{ url: string; label: string }[]> {
  const files = await glob('public/logbook/landmarks/**/*', { nodir: true });
  return files.sort().map((f) => ({
    url: encodeURI(f.replace(/^\/?public/, '')),
    label: basename(f, extname(f)),
  }));
}
