import type { Flight } from '@libs/flying';

type Props = {
  flight: Flight;
  height: number;
  igc?: IGCFile
};

import L from 'leaflet';
import "@maptiler/leaflet-maptilersdk";
import { MaptilerLayer } from "@maptiler/leaflet-maptilersdk";

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import IGCParser, { type IGCFile } from 'igc-parser';
import Map, { Source, Layer, type MapRef } from 'react-map-gl/maplibre';
import type { LngLatBoundsLike } from 'mapbox-gl';

type LatLng = {
  lat: number,
  lng: number
}

const getBounds = (positions: LatLng[]) => {

  return {
    min: {
      lat: Math.min(...positions.map(p => p.lat)),
      lng: Math.min(...positions.map(p => p.lng)),
    },
    max: {
      lat: Math.max(...positions.map(p => p.lat)),
      lng: Math.max(...positions.map(p => p.lng)),
    }
  }


}

export default function FlightPreview(props: Props) {
  const { flight, height, igc } = props;
  const [map, setMap] = useState<MapRef | null>(null);

  const position = { lat: igc.fixes[0].latitude, lng: igc.fixes[0].longitude }
  const positions = igc.fixes.map((p) => {
    return {
      lat: p.latitude,
      lng: p.longitude,
    }
  })
  const lastPosition = positions.at(-1) as LatLng;

  const data = {
    type: "Feature",
    geometry: {
      type: 'LineString',
      coordinates: positions.map(p => [p.lng, p.lat])
    }
  }

  useEffect(() => {
    if(!map) {
      return;
    }

    const bounds = getBounds(positions);

    // debugger;
    map.fitBounds([bounds.min, bounds.max], {animate: false, padding: 20});
  }, [map]);

  return (
    <div className="pb-4">
      <Map
      ref={(ref) => setMap(ref)}
        initialViewState={{
          longitude: position.lng,
          latitude: position.lat,
          zoom: 10
        }}
        style={{ width: "100%", height: height }}
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
        <Source type='geojson' data={data}>
          <Layer
            type='line'
            paint={{
              "line-width": 2,
              "line-color": "green",
            }}
            
          />
        </Source>
      </Map>
    </div>
  )
}





//   useEffect(() => {
//     if(!mapRef.current || !igc) {
//       return;
//     }

//     const map = L.map(mapRef.current, {
//       attributionControl: true,
//       zoomControl: false,
//     }).setView([igc.fixes[0].latitude, igc.fixes[0].longitude ], 10);

//     map.dragging.disable();
//     map.touchZoom.disable();
//     map.doubleClickZoom.disable();
//     map.scrollWheelZoom.disable();
//     map.boxZoom.disable();
//     map.keyboard.disable();

//     // L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(
//     //   map
//     // );

//     // L.tileLayer('https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=KFYBsfFWC5kx8RrE5mb8', {}).addTo(map);

//     // const mtLayer = L.maptilerLayer({
//     //   apiKey: "KFYBsfFWC5kx8RrE5mb8",
//     //   style: L.MaptilerStyle.STREETS, // optional
      
//     // }).addTo(map);

//     const mtLayer = new L.MaptilerLayer({});


//     console.log('Tiles added');
//   }, [mapRef]);

//   return (
//     <div
//       id={mapId}
//       ref={mapRef}
//       style={{
//         height: height,
//       }}
//     />
//   );

// }
