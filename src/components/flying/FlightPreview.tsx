import type { Flight } from '@libs/flyingTypes';

type Props = {
  flight: Flight;
  height: number;
  interactive?: boolean;
};

import { useEffect, useRef, useState } from 'react';
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
  const mapRef = useRef<MapRef | null>(null);
  const [igc, setIgc] = useState<IGCFile | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [controlsEnabled, setControlsEnabled] = useState(false);
  const controlsEnabledRef = useRef(false);

  // Cancel rotation on unmount
  useEffect(() => {
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  // Download the flight IGC file
  useEffect(() => {
    const url = flight.igcFile?.filePathUrl;
    if (!url) return;
    axios.get(url, { responseType: 'text' }).then((response) => {
      setIgc(IGCParser.parse(response.data));
    });
  }, []);

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
  const positions = igc.fixes.map((p) => ({
    lat: p.latitude,
    lng: p.longitude,
    alt: p.gpsAltitude,
  }));
  const bounds = getBounds(positions);

  const data = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: positions.map((p) => [p.lng, p.lat, p.alt]),
    },
  };

  // Called by react-map-gl's onLoad — fires exactly once after style + resources are ready.
  // Avoids the style.load timing race that breaks Safari.
  const handleLoad = () => {
    const map = mapRef.current;
    if (!map) return;

    map.fitBounds([bounds.min, bounds.max], { animate: false, padding: 20 });
    map.getMap().zoomTo(map.getMap().getZoom() + 0.5, { duration: 0 });
    map.getMap().setPitch(interactive ? 70 : 0);

    if (!interactive) return;

    map.getMap().on('mousedown', () => {
      if (!controlsEnabledRef.current) return;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    });
    map.getMap().on('touchstart', () => {
      if (!controlsEnabledRef.current) return;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    });

    // Poll on each render frame until the DEM source is loaded and terrain is active.
    // We can't use 'idle' because other tile sources (hillshade, outdoor style) may
    // keep the map busy indefinitely after DEM tiles arrive. And we can't add the
    // Threebox layer before DEM tiles load because Threebox's CameraSync only syncs
    // its camera on 'move' events — if terrain isn't loaded yet when CameraSync
    // initialises, t._camera.position[2] is wrong and the track floats above terrain.
    let trackLayerAdded = false;
    const addWhenDemReady = () => {
      if (trackLayerAdded) return;
      try {
        if (!map.getMap().getTerrain() || !map.getMap().isSourceLoaded('mapbox-dem')) return;
      } catch (_) {
        return; // source not yet registered
      }
      trackLayerAdded = true;
      map.getMap().off('render', addWhenDemReady);

      const logCameraState = (label: string) => {
        const t = (map.getMap() as any).transform;
        console.log(`[FlightPreview] ${label}`, {
          'camera.position[2]': t._camera?.position[2],
          'camera.position': t._camera?.position?.slice(),
          'elevation set': !!t.elevation,
          'centerAltitude': t._centerAltitude,
          'zoom': t._zoom,
          'pitch': t._pitch * 180 / Math.PI,
        });
      };

      logCameraState('DEM ready → adding layer');
      map.getMap().on('move', () => logCameraState('move event'));

      let tb: Threebox | undefined = undefined;
      let frameCount = 0;
      map.getMap().addLayer({
        id: 'custom layer',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, mbxContext) {
          logCameraState('onAdd');
          tb = new Threebox(map, mbxContext, { defaultLights: true });
          logCameraState('after Threebox init');
          for (let i = 1; i < igc.fixes.length - 1; i++) {
            // NOTE: height multiplier is a known Threebox quirk — 1.5x matches visual expectations
            const line_segment = tb.line({
              geometry: [
                [igc.fixes[i].longitude, igc.fixes[i].latitude, (igc.fixes[i].gpsAltitude || 0) * 1.5],
                [igc.fixes[i - 1].longitude, igc.fixes[i - 1].latitude, (igc.fixes[i - 1].gpsAltitude || 0) * 1.5],
              ],
              color: '#dd0000',
              width: 4,
              opacity: 1,
            });
            tb.add(line_segment);
          }
        },
        render: function (_gl, _matrix) {
          if (tb) {
            frameCount++;
            if (frameCount <= 5) {
              const t = (map as any).transform;
              console.log(`[FlightPreview] render #${frameCount}`, {
                'camera.position[2]': t._camera?.position[2],
                'tb.camera.matrixWorld[14]': tb.camera.matrixWorld.elements[14],
              });
            }
            tb.update();
          }
        },
      });

      let bearing = 0;
      const rotate = () => {
        bearing = (bearing + 0.06) % 360;
        map.getMap().setBearing(bearing);
        animFrameRef.current = requestAnimationFrame(rotate);
      };
      animFrameRef.current = requestAnimationFrame(rotate);
    };
    map.getMap().on('render', addWhenDemReady);
  };

  return (
    <div className="relative">
      <Map
        ref={mapRef}
        onLoad={handleLoad}
        initialViewState={{
          longitude: position.lng,
          latitude: position.lat,
          zoom: 10,
        }}
        style={{ width: '100%', height: height }}
        // Outdoor Map style
        mapStyle="https://api.maptiler.com/maps/outdoor-v2/style.json?key=KFYBsfFWC5kx8RrE5mb8"
        mapboxAccessToken="pk.eyJ1Ijoic2NvdHR5b2IiLCJhIjoiY200bWN2ZTRxMGIzZzJpbjBrN2Z2MmgyaSJ9.uLLI2T-mOqaYejD2K3a_MQ"
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        attributionControl={interactive}
        scrollZoom={interactive && controlsEnabled}
        touchZoomRotate={interactive && controlsEnabled}
        dragPan={interactive && controlsEnabled}
        dragRotate={interactive && controlsEnabled}
        doubleClickZoom={interactive && controlsEnabled}
        keyboard={interactive && controlsEnabled}
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
            layout={{ visibility: 'visible' }}
            paint={{"hillshade-shadow-color": "#473B24"}}
          />
        </Source>
        {interactive && controlsEnabled && <NavigationControl position='top-right' showZoom={true} showCompass />}
      </Map>
      {interactive && (
        <button
          onClick={() => {
            const next = !controlsEnabledRef.current;
            controlsEnabledRef.current = next;
            setControlsEnabled(next);
          }}
          title={controlsEnabled ? 'Disable map controls' : 'Enable map controls'}
          className="absolute top-2.5 left-2.5 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors pointer-events-auto"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M18 11V6a2 2 0 0 0-4 0"/>
            <path d="M14 10V4a2 2 0 0 0-4 0v2"/>
            <path d="M10 10.5V6a2 2 0 0 0-4 0v8"/>
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
            {!controlsEnabled && <line x1="2" y1="2" x2="22" y2="22"/>}
          </svg>
        </button>
      )}
    </div>
  );
}
