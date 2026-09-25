'use client';

import { useMemo } from 'react';
import { geoEqualEarth, geoGraticule, geoInterpolate, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import worldAtlas from 'world-atlas/countries-110m.json';

type Coordinate = [number, number];

const worldFeatures = feature(worldAtlas as any, (worldAtlas as any).objects.countries) as any;

function projectRoutePath(projection: ReturnType<typeof geoEqualEarth>, from: Coordinate, to: Coordinate) {
  const interpolate = geoInterpolate(from, to);
  const coordinates = Array.from({ length: 41 }, (_, index) => interpolate(index / 40));
  return geoPath(projection)({ type: 'LineString', coordinates } as any) ?? '';
}

export default function DiscoveryMap({ originCoordinates, destinationCoordinates }: { originCoordinates?: Coordinate; destinationCoordinates?: Coordinate }) {
  const projection = useMemo(() => {
    const base = geoEqualEarth();
    return base.fitExtent([[40, 28], [960, 492]], worldFeatures);
  }, []);
  const path = useMemo(() => geoPath(projection), [projection]);
  const graticule = useMemo(() => geoGraticule().step([20, 20])(), []);
  const originPoint = originCoordinates ? projection(originCoordinates) : undefined;
  const destinationPoint = destinationCoordinates ? projection(destinationCoordinates) : undefined;

  return (
    <div className="discovery-map route-map" aria-hidden="true">
      <svg viewBox="0 0 1000 520" role="presentation"><path className="map-graticule" d={path(graticule) ?? ''} /><path className="map-countries" d={path(worldFeatures) ?? ''} />{originPoint && destinationPoint && <path className="map-route-preview" d={projectRoutePath(projection, originCoordinates!, destinationCoordinates!)} />}{originPoint && <circle className="map-origin" cx={originPoint[0]} cy={originPoint[1]} r="4.5" />}{destinationPoint && <circle className="map-destination" cx={destinationPoint[0]} cy={destinationPoint[1]} r="4.5" />}</svg>
    </div>
  );
}
