import type { Flight } from '@libs/flyingTypes';

type Props = {
  flight: Flight;
  height: number;
  interactive?: boolean;
};

import { useEffect, useState } from 'react';
import IGCParser, { type IGCFile } from 'igc-parser';
import Map, { Source, Layer, type MapRef, NavigationControl } from 'react-map-gl';
import axios from 'axios';
// @ts-ignore
import { Threebox } from 'threebox-plugin';

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
  const { flight, height, interactive } = props;
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

    // Render 3D overlay if interactive
    map.on('style.load', function () {

      map.fitBounds([bounds.min, bounds.max], { animate: false, padding: 40 });
      if (!interactive) {
        return;
      }

      let tb: Threebox | undefined = undefined;

      map.getMap().addLayer({
        id: "custom layer",
        type: "custom",
        renderingMode: "3d",
        onAdd: function (map, mbxContext) {
          tb = new Threebox(map, mbxContext, { defaultLights: true });
          if (!igc) return;

          for (let i = 1; i < igc.fixes.length - 1; i++) {
            // Draw a line between each point with altitude with the point before
            const line_segment = tb.line({
              // NOTE:  Taken from example online, where the height is broken and setting a 1.5 multiplier seems to do the trick
              // Intent is to use the 3D Cesium replayer for playback which seems to have a more accurate representation
              geometry: [
                [igc.fixes[i].longitude, igc.fixes[i].latitude, (igc.fixes[i].gpsAltitude || 0) * 1.5],
                [igc.fixes[i - 1].longitude, igc.fixes[i - 1].latitude, (igc.fixes[i - 1].gpsAltitude || 0) * 1.5],
              ],
              color: '#dd0000', // color based on latitude of endpoint
              width: 4,
              opacity: 1,
            });
            tb.add(line_segment);
          }

        },
        render: function (_gl, _matrix) {
          if (tb) {
            tb.update();
          }
        }
      })
    });
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
      alt: p.gpsAltitude,
    };
  });

  const data = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: positions.map((p) => [p.lng, p.lat, p.alt]),
    },
  };

  return (
    <div className="">
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

        // Normal Map style
        mapStyle="https://api.maptiler.com/maps/streets/style.json?key=KFYBsfFWC5kx8RrE5mb8"

        // 3D Map Style???
        // mapStyle="mapbox://styles/mapbox/satellite-v9"
        mapboxAccessToken="pk.eyJ1Ijoic2NvdHR5b2IiLCJhIjoiY200bWN2ZTRxMGIzZzJpbjBrN2Z2MmgyaSJ9.uLLI2T-mOqaYejD2K3a_MQ"
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        attributionControl={interactive}
        scrollZoom={interactive}
        touchZoomRotate={interactive}
        dragPan={interactive}
        doubleClickZoom={interactive}
        interactive={interactive}
      >
        <Source type="geojson" data={data}>
          <Layer
            type="line"
            id='lines'
            paint={{
              'line-width': 2,
              'line-color': interactive ? 'lightgray' : 'green',
            }}
          />
        </Source>
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />
        <Source
          type='raster-dem'
          url='https://demotiles.maplibre.org/terrain-tiles/tiles.json'
          tileSize={256}
        >
          <Layer
            type='hillshade'
            id='hillshade'
            layout={{
              visibility: 'visible',
            }}
            paint={{"hillshade-shadow-color": "#473B24"}}
          />
          </Source>
        {interactive && <NavigationControl position='top-right' showZoom={true} showCompass />}
      </Map>
    </div>
  );
}
