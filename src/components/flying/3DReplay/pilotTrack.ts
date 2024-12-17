import * as Cesium from 'cesium';
import IGCParser from 'igc-parser';


export async function addIgcToViewer(viewer: Cesium.Viewer, igc: IGCParser.IGCFile, terrainProvider: Cesium.TerrainProvider) {

    // Find the height above ground for each point
    const aboveGroundHeights = await Cesium.sampleTerrainMostDetailed(terrainProvider, igc.fixes.map(fix => Cesium.Cartographic.fromDegrees(fix.longitude, fix.latitude)));

    // Find the igc file start and stop times
    const startTime = Cesium.JulianDate.fromIso8601(
        new Date(igc.fixes[0].timestamp).toISOString()
    );
    const stopTime = Cesium.JulianDate.fromIso8601(
        new Date(igc.fixes[igc.fixes.length - 1].timestamp).toISOString()
    );

    // Add the flight track
    const aboveGroundTrack = new Cesium.SampledPositionProperty();
    const onGroundTrack = new Cesium.SampledPositionProperty();
    igc.fixes.forEach((fix, i) => {
        onGroundTrack.addSample(
            Cesium.JulianDate.fromDate(new Date(fix.timestamp)),
            Cesium.Cartesian3.fromDegrees(
                fix.longitude,
                fix.latitude,
                aboveGroundHeights[i].height + 1,
            )
        );
        aboveGroundTrack.addSample(
            Cesium.JulianDate.fromDate(new Date(fix.timestamp)),
            Cesium.Cartesian3.fromDegrees(
                fix.longitude,
                fix.latitude,
                //(fix.gpsAltitude ?? 0),
                fix.pressureAltitude ?? 0,
            )
        );
    });

    // Render the paths that change over time.
    const onGroundPathViewer = viewer.entities.add({
        name: igc.pilot ?? 'Anonymous',
        position: onGroundTrack,

        path: {
            resolution: 1,
            width: 1,
            trailTime: 15,
            leadTime: 0,
            material: Cesium.Color.DARKGREEN.withAlpha(0.8),
        },
    });
    // Above Ground Path Viewer.  Viewer that shows the path of the flight above the ground.
    viewer.entities.add({
        name: igc.pilot ?? 'Anonymous',
        position: aboveGroundTrack,

        path: {
            resolution: 1,
            width: 3,
            trailTime: 120,
            leadTime: 0,
            material: Cesium.Color.LIGHTGREEN,
        },
    });

    // Create an entity to both visualize the entire radar sample series with a line and add a point that moves along the samples.
    const pilotEntity = viewer.entities.add({
        id: igc.pilot ?? 'Anonymous',
        name: igc.pilot ?? 'Anonymous',
        availability: new Cesium.TimeIntervalCollection([
            new Cesium.TimeInterval({
                start: startTime.clone(),
                stop: stopTime.clone(),
            }),
        ]),
        position: aboveGroundTrack,
        point: { pixelSize: 1, color: Cesium.Color.GREEN },
        viewFrom: new Cesium.Cartesian3(1000, 1000, 1000),
        // path: new Cesium.PathGraphics({ width: 3 }),
    });
    // Draw a line from the pilotEntity right down to the ground

    // Cesium callback to update the line's position based on where the pilot is.
    const lineToGroundPositions = new Cesium.CallbackProperty((time) => {
        const currentPosition = pilotEntity.position?.getValue(time);
        return [currentPosition, Cesium.Cartesian3.ZERO];
    }, false);

    // The line that goes from the pilotEntity to the ground (center of the earth)
    viewer.entities.add({
        parent: pilotEntity,
        polyline: {
            positions: lineToGroundPositions,
            width: 1,
            arcType: Cesium.ArcType.NONE,
            material: Cesium.Color.GREEN.withAlpha(0.5),
        },
    });
    
    return {
        pilotEntity,
        onGroundPathViewer,
        aboveGroundTrack
    }

}