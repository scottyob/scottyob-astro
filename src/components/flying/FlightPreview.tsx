//import { getFlightUrl, type Flight } from '@libs/flying';
import type { Flight } from '@libs/flying'

type Props = {
  flight: Flight;
  height: number;
};

import '@maptiler/leaflet-maptilersdk';

import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import IGCParser, { type IGCFile } from 'igc-parser';
import Map, { Source, Layer, type MapRef } from 'react-map-gl/maplibre';
import axios from 'axios';

type LatLng = {
  lat: number;
  lng: number;
};

const getBounds = (positions: LatLng[]) => {
  return {
    min: {
      lat: Math.min(...positions.map((p) => p.lat)),
      lng: Math.min(...positions.map((p) => p.lng)),
    },
    max: {
      lat: Math.max(...positions.map((p) => p.lat)),
      lng: Math.max(...positions.map((p) => p.lng)),
    },
  };
};

export default function FlightPreview(props: Props) {
  const { flight, height } = props;
  const [map, setMap] = useState<MapRef | null>(null);
  const [igc, setIgc] = useState<IGCFile | null>(null);

  // Download the flight image
  useEffect(() => {
    const url = flight.igcFile?.filePathUrl;
    if (!url) {
      return;
    }
    axios.get(url, { responseType: 'text' }).then((response) => {
      setIgc(IGCParser.parse(response.data));
    });
  }, []);

  // Setup our bounds fitting on render
  useEffect(() => {
    if (!map) {
      return;
    }

    const bounds = getBounds(positions);

    // debugger;
    map.fitBounds([bounds.min, bounds.max], { animate: false, padding: 20 });
  }, [map]);

  if (!igc) {
    return (
      <div
        style={{ height: '100%' }}
        className="animate-pulse flex align-middle justify-center"
      >
        <div className="m-auto">...</div>
      </div>
    );
  }

  const position = { lat: igc.fixes[0].latitude, lng: igc.fixes[0].longitude };
  const positions = igc.fixes.map((p) => {
    return {
      lat: p.latitude,
      lng: p.longitude,
    };
  });
  const lastPosition = positions.at(-1) as LatLng;

  const data = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: positions.map((p) => [p.lng, p.lat]),
    },
  };

  return (
    <div className="pb-4">
      <Map
        ref={(ref) => setMap(ref)}
        initialViewState={{
          longitude: position.lng,
          latitude: position.lat,
          zoom: 10,
        }}
        style={{ width: '100%', height: height }}
        // Satelite Style
        // mapStyle="https://api.maptiler.com/maps/satellite/style.json?key=KFYBsfFWC5kx8RrE5mb8"

        // Map style
        mapStyle="https://api.maptiler.com/maps/streets/style.json?key=KFYBsfFWC5kx8RrE5mb8"
        attributionControl={false}
        scrollZoom={false}
        touchZoomRotate={false}
        dragPan={false}
        doubleClickZoom={false}
      >
        <Source type="geojson" data={data}>
          <Layer
            type="line"
            paint={{
              'line-width': 2,
              'line-color': 'green',
            }}
          />
        </Source>
      </Map>
    </div>
  );
}