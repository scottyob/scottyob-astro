import * as Cesium from 'cesium';
import type { Waypoint } from '@libs/waypoints';
import { TimeInterval, TimeIntervalCollectionProperty } from 'cesium';

export async function addWaypointsToViewer(viewer: Cesium.Viewer, waypoints: Waypoint[]) {
    // Get the waypoints position at ground level.
    const waypointGroundPositions = await Cesium.sampleTerrainMostDetailed(
        viewer.terrainProvider,
        waypoints.map(w => Cesium.Cartographic.fromDegrees(w.longitude, w.latitude)));

    waypoints.forEach((w, i) => {
        // Render the cylinder column for the waypoint.

        // Check if the waypoint was ever achieved.  Changed the color when it's achieved
        const achievedTime = w.achievedTime;
        const previousAchievedTime = waypoints[i - 1]?.achievedTime;

        const colorAtTime = new TimeIntervalCollectionProperty();
        const outlineProperty = new TimeIntervalCollectionProperty();

        colorAtTime.intervals.addInterval(
            new TimeInterval({
                start: Cesium.JulianDate.fromIso8601('1980-08-01T00:00:00Z'),
                stop: Cesium.JulianDate.fromDate(
                    new Date(previousAchievedTime || 4070941261 * 1000)
                ),
                isStopIncluded: true,
                isStartIncluded: true,
                data: Cesium.Color.GRAY.withAlpha(0.15)
            })
        );
        outlineProperty.intervals.addInterval(
            new TimeInterval({
                start: Cesium.JulianDate.fromIso8601('1980-08-01T00:00:00Z'),
                stop: Cesium.JulianDate.fromDate(
                    new Date(achievedTime || 4070941261 * 1000)
                ),
                isStopIncluded: true,
                isStartIncluded: true,
                data: true
            })
        );

        if (previousAchievedTime != null) {
            colorAtTime.intervals.addInterval(
                new TimeInterval({
                    start: Cesium.JulianDate.fromDate(new Date(previousAchievedTime)),
                    stop: Cesium.JulianDate.fromDate(
                        new Date(achievedTime || 4070941261 * 1000)
                    ),
                    isStartIncluded: true,
                    isStopIncluded: true,
                    data: Cesium.Color.ORANGERED.withAlpha(0.12)
                })
            );
        }

        if (achievedTime != null) {
            colorAtTime.intervals.addInterval(
                new TimeInterval({
                    start: Cesium.JulianDate.fromDate(new Date(achievedTime)),
                    stop: Cesium.JulianDate.fromIso8601('2033-08-01T00:00:00Z'),
                    isStartIncluded: true,
                    isStopIncluded: true,
                    data: Cesium.Color.GREEN.withAlpha(0)
                })
            );
        }


        const position = waypointGroundPositions[i];
        const waypointEntity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(
                w.longitude,
                w.latitude,
                position.height
            ),
            cylinder: {
                topRadius: w.radiusMeters,
                bottomRadius: w.radiusMeters,
                length: 1000,
                material: new Cesium.ColorMaterialProperty(colorAtTime),
                outline: outlineProperty,
                outlineColor: Cesium.Color.BLUE,
            }
        });

    });
}

