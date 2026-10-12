'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Script from 'next/script';

type GlobeEntity = {
  id: string;
  title: string;
  detail: string;
  latitude: number;
  longitude: number;
  kind: 'aircraft' | 'earthquake' | 'satellite' | 'place';
  magnitude?: number;
  url?: string;
};

declare global {
  interface Window {
    Cesium?: any;
  }
}

const EARTHQUAKES_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
const AIRCRAFT_URL = 'https://api.adsb.lol/v2/lat/39.0/lon/-96.0/dist/250';

function safeText(value: unknown, fallback = 'Unknown') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeAircraft(payload: any): GlobeEntity[] {
  if (!Array.isArray(payload?.ac)) return [];
  return payload.ac.slice(0, 180).flatMap((aircraft: any, index: number) => {
    const lat = Number(aircraft.lat);
    const lon = Number(aircraft.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
    const callsign = safeText(aircraft.flight || aircraft.hex, 'Aircraft');
    const altitude = Number(aircraft.alt_baro);
    const speed = Number(aircraft.gs);
    return [{
      id: `aircraft-${safeText(aircraft.hex, String(index))}`,
      title: callsign,
      detail: [
        safeText(aircraft.t, 'Aircraft type unavailable'),
        Number.isFinite(altitude) ? `${Math.round(altitude).toLocaleString()} ft` : '',
        Number.isFinite(speed) ? `${Math.round(speed)} kt` : '',
      ].filter(Boolean).join(' · '),
      latitude: lat,
      longitude: lon,
      kind: 'aircraft' as const,
    }];
  });
}

function normalizeEarthquakes(payload: any): GlobeEntity[] {
  if (!Array.isArray(payload?.features)) return [];
  return payload.features.slice(0, 250).flatMap((feature: any, index: number) => {
    const coordinates = feature?.geometry?.coordinates;
    const lon = Number(coordinates?.[0]);
    const lat = Number(coordinates?.[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
    const properties = feature?.properties ?? {};
    const magnitude = Number(properties.mag);
    const title = safeText(properties.place, 'Earthquake');
    const time = Number(properties.time);
    return [{
      id: `quake-${safeText(properties.code, String(index))}`,
      title,
      detail: `Magnitude ${Number.isFinite(magnitude) ? magnitude.toFixed(1) : 'unknown'}${Number.isFinite(time) ? ` · ${new Date(time).toLocaleString()}` : ''}`,
      latitude: lat,
      longitude: lon,
      kind: 'earthquake' as const,
      magnitude: Number.isFinite(magnitude) ? magnitude : undefined,
      url: typeof properties.url === 'string' ? properties.url : undefined,
    }];
  });
}

export default function GodsEyeView() {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const entityHandlesRef = useRef<Map<string, any>>(new Map());
  const [scriptReady, setScriptReady] = useState(false);
  const [search, setSearch] = useState('');
  const [layerVisibility, setLayerVisibility] = useState({
    aircraft: true,
    earthquake: true,
    satellite: false,
    places: false,
  });
  const [entities, setEntities] = useState<GlobeEntity[]>([]);
  const [selected, setSelected] = useState<GlobeEntity | null>(null);
  const [feedStatus, setFeedStatus] = useState({
    aircraft: 'Connecting',
    earthquakes: 'Connecting',
  });
  const [feedUpdated, setFeedUpdated] = useState<string | null>(null);
  const [globeError, setGlobeError] = useState('');

  const filteredEntities = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entities.filter((entity) => {
      const visible = entity.kind === 'aircraft'
        ? layerVisibility.aircraft
        : entity.kind === 'earthquake'
          ? layerVisibility.earthquake
          : entity.kind === 'satellite'
            ? layerVisibility.satellite
            : layerVisibility.places;
      return visible && (!query || `${entity.title} ${entity.detail}`.toLowerCase().includes(query));
    });
  }, [entities, layerVisibility, search]);

  useEffect(() => {
    if (!scriptReady || !hostRef.current || !window.Cesium || viewerRef.current) return;
    const Cesium = window.Cesium;
    try {
      const viewer = new Cesium.Viewer(hostRef.current, {
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: true,
        sceneModePicker: true,
        baseLayerPicker: false,
        navigationHelpButton: false,
        fullscreenButton: true,
        infoBox: false,
        selectionIndicator: true,
        shouldAnimate: true,
        baseLayer: false,
        terrain: new Cesium.EllipsoidTerrainProvider(),
      });
      viewerRef.current = viewer;
      viewer.scene.globe.enableLighting = true;
      viewer.scene.skyAtmosphere.show = true;
      viewer.scene.globe.depthTestAgainstTerrain = false;
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 120;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-98.5, 39.5, 19000000),
        duration: 1.2,
      });
      viewer.selectedEntityChanged.addEventListener((selectedEntity: any) => {
        if (!selectedEntity?.properties?.gevEntity) return;
        setSelected(selectedEntity.properties.gevEntity.getValue(Cesium.JulianDate.now()));
      });
    } catch (error) {
      setGlobeError(error instanceof Error ? error.message : 'The globe could not start.');
    }

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) viewerRef.current.destroy();
      viewerRef.current = null;
      entityHandlesRef.current.clear();
    };
  }, [scriptReady]);

  useEffect(() => {
    if (!scriptReady) return;
    let cancelled = false;
    const fetchFeeds = async () => {
      const results = await Promise.allSettled([
        fetch(AIRCRAFT_URL, { cache: 'no-store' }).then((response) => {
          if (!response.ok) throw new Error('Aircraft feed unavailable');
          return response.json();
        }),
        fetch(EARTHQUAKES_URL, { cache: 'no-store' }).then((response) => {
          if (!response.ok) throw new Error('Earthquake feed unavailable');
          return response.json();
        }),
      ]);
      if (cancelled) return;
      const next: GlobeEntity[] = [];
      if (results[0].status === 'fulfilled') {
        next.push(...normalizeAircraft(results[0].value));
        setFeedStatus((previous) => ({ ...previous, aircraft: 'Live' }));
      } else {
        setFeedStatus((previous) => ({ ...previous, aircraft: 'Unavailable' }));
      }
      if (results[1].status === 'fulfilled') {
        next.push(...normalizeEarthquakes(results[1].value));
        setFeedStatus((previous) => ({ ...previous, earthquakes: 'Live' }));
      } else {
        setFeedStatus((previous) => ({ ...previous, earthquakes: 'Unavailable' }));
      }
      setEntities(next);
      setFeedUpdated(new Date().toLocaleTimeString());
    };
    fetchFeeds();
    const interval = window.setInterval(fetchFeeds, 90_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [scriptReady]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium || viewer.isDestroyed()) return;
    const handles = entityHandlesRef.current;
    const seen = new Set<string>();
    for (const record of entities) {
      seen.add(record.id);
      let entity = handles.get(record.id);
      const color = record.kind === 'aircraft'
        ? Cesium.Color.fromCssColorString('#60e5d1')
        : record.kind === 'earthquake'
          ? Cesium.Color.fromCssColorString('#ff8b62')
          : Cesium.Color.fromCssColorString('#a3b5ff');
      if (!entity) {
        entity = viewer.entities.add({
          id: record.id,
          name: record.title,
          position: Cesium.Cartesian3.fromDegrees(record.longitude, record.latitude, 800),
          point: {
            pixelSize: record.kind === 'earthquake'
              ? Math.max(6, Math.min(18, 5 + (record.magnitude ?? 1) * 2))
              : 6,
            color,
            outlineColor: Cesium.Color.BLACK.withAlpha(0.8),
            outlineWidth: 1,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: record.title,
            font: '11px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -14),
            show: false,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          properties: { gevEntity: record },
        });
        handles.set(record.id, entity);
      } else {
        entity.name = record.title;
        entity.position = Cesium.Cartesian3.fromDegrees(record.longitude, record.latitude, 800);
        entity.properties.gevEntity = record;
      }
    }
    for (const [id, entity] of handles) {
      const record = entities.find((item) => item.id === id);
      if (!seen.has(id) || !record) {
        viewer.entities.remove(entity);
        handles.delete(id);
      }
    }
  }, [entities]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    for (const entity of entityHandlesRef.current.values()) {
      const properties = entity.properties?.gevEntity;
      const record = properties?.getValue?.(window.Cesium.JulianDate.now());
      if (!record) continue;
      const visible = record.kind === 'aircraft'
        ? layerVisibility.aircraft
        : record.kind === 'earthquake'
          ? layerVisibility.earthquake
          : record.kind === 'satellite'
            ? layerVisibility.satellite
            : layerVisibility.places;
      const matches = !search.trim() || `${record.title} ${record.detail}`.toLowerCase().includes(search.trim().toLowerCase());
      entity.show = visible && matches;
      if (entity.label) entity.label.show = visible && matches && selected?.id === record.id;
    }
  }, [layerVisibility, search, selected, entities]);

  function flyToTarget(record: GlobeEntity) {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium || viewer.isDestroyed()) return;
    setSelected(record);
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(record.longitude, record.latitude, record.kind === 'aircraft' ? 220000 : 450000),
      duration: 1.1,
    });
    const entity = entityHandlesRef.current.get(record.id);
    if (entity) viewer.selectedEntity = entity;
  }

  function resetGlobe() {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium || viewer.isDestroyed()) return;
    setSelected(null);
    viewer.selectedEntity = undefined;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(-98.5, 39.5, 19000000),
      duration: 1.2,
    });
  }

  function toggleLayer(key: keyof typeof layerVisibility) {
    setLayerVisibility((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <main className="gev-shell">
      <Script
        src="https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Cesium.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
        onError={() => setGlobeError('Cesium failed to load. Check your connection and refresh.')}
      />
      <link
        rel="stylesheet"
        href="https://cesium.com/downloads/cesiumjs/releases/1.124/Build/Cesium/Widgets/widgets.css"
      />
      <header className="gev-topbar">
        <a href="/" className="gev-brand"><span className="gev-mark">G</span><span>GOD’S EYE VIEW<small>PUBLIC SIGNALS · LIVE GLOBE</small></span></a>
        <div className="gev-top-actions">
          <span className="gev-live"><i /> LIVE SOURCES</span>
          <button type="button" onClick={resetGlobe}>RESET GLOBE</button>
        </div>
      </header>
      <div className="gev-layout">
        <aside className="gev-sidebar">
          <section>
            <p className="gev-eyebrow">WORLD MONITOR</p>
            <h1>Global picture</h1>
            <p className="gev-subtitle">Explore public signals on a live 3D globe.</p>
          </section>
          <label className="gev-search"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search live contacts" /></label>
          <section className="gev-panel">
            <div className="gev-panel-heading"><span>DATA LAYERS</span><span>{filteredEntities.length} VISIBLE</span></div>
            <LayerToggle label="Aircraft" detail={`ADS-B · ${feedStatus.aircraft.toUpperCase()}`} color="#60e5d1" checked={layerVisibility.aircraft} onChange={() => toggleLayer('aircraft')} />
            <LayerToggle label="Earthquakes" detail={`USGS · ${feedStatus.earthquakes.toUpperCase()}`} color="#ff8b62" checked={layerVisibility.earthquake} onChange={() => toggleLayer('earthquake')} />
            <LayerToggle label="Satellites" detail="NOT CONNECTED IN THIS BUILD" color="#a3b5ff" checked={layerVisibility.satellite} onChange={() => toggleLayer('satellite')} />
            <LayerToggle label="Places & infrastructure" detail="NOT CONNECTED IN THIS BUILD" color="#d9b76e" checked={layerVisibility.places} onChange={() => toggleLayer('places')} />
          </section>
          <section className="gev-panel">
            <div className="gev-panel-heading"><span>FEED HEALTH</span><span>{feedUpdated ? 'UPDATED' : 'CHECKING'}</span></div>
            <StatusRow label="Aircraft telemetry" value={feedStatus.aircraft} />
            <StatusRow label="Seismic events" value={feedStatus.earthquakes} />
            <StatusRow label="Last refresh" value={feedUpdated ?? 'Pending'} />
          </section>
          <section className="gev-panel gev-contacts">
            <div className="gev-panel-heading"><span>CONTACTS</span><span>{filteredEntities.length}</span></div>
            {filteredEntities.length ? filteredEntities.slice(0, 30).map((record) => (
              <button key={record.id} type="button" className={`gev-contact ${selected?.id === record.id ? 'selected' : ''}`} onClick={() => flyToTarget(record)}>
                <span className={`gev-contact-dot ${record.kind}`} />
                <span className="gev-contact-copy"><strong>{record.title}</strong><small>{record.detail}</small></span>
                <span className="gev-contact-arrow">↗</span>
              </button>
            )) : <p className="gev-empty">{scriptReady ? 'No matching contacts in the current public feeds.' : 'Starting the globe and connecting to public feeds…'}</p>}
          </section>
          <p className="gev-disclaimer">Public-data visualization. Signals can be delayed or incomplete. Not for navigation or emergency response.</p>
        </aside>
        <section className="gev-viewport" aria-label="Interactive 3D globe">
          <div ref={hostRef} className="gev-globe" />
          {globeError && <div className="gev-error">{globeError}</div>}
          <div className="gev-hud gev-hud-top"><span>GEV / EARTH</span><span>{feedUpdated ? `LAST SYNC ${feedUpdated}` : 'ACQUIRING SIGNAL'}</span></div>
          <div className="gev-hud gev-hud-bottom"><span>DATA: PUBLIC FEEDS</span><span>CLICK A CONTACT TO TRACK</span></div>
          {selected && <div className="gev-selected"><button type="button" aria-label="Close selected contact" onClick={() => { setSelected(null); if (viewerRef.current) viewerRef.current.selectedEntity = undefined; }}>×</button><p className="gev-eyebrow">TRACKED CONTACT</p><h2>{selected.title}</h2><p>{selected.detail}</p><small>{selected.latitude.toFixed(3)}°, {selected.longitude.toFixed(3)}°</small>{selected.url && <a href={selected.url} target="_blank" rel="noreferrer">Open source ↗</a>}</div>}
        </section>
      </div>
      <style jsx global>{`
        .gev-shell{height:100dvh;min-height:680px;background:#080d12;color:#d9e5ee;font-family:Arial,Helvetica,sans-serif;display:flex;flex-direction:column;overflow:hidden}
        .gev-topbar{height:64px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 22px;border-bottom:1px solid #25323c;background:#0b1117;position:relative;z-index:2}
        .gev-brand{display:flex;gap:10px;align-items:center;font-size:12px;font-weight:700;letter-spacing:.14em;color:#eff7fb}.gev-brand small{display:block;font-size:8px;color:#738794;letter-spacing:.13em;margin-top:4px;font-weight:600}
        .gev-mark{height:31px;width:31px;display:grid;place-items:center;border:1px solid #43ceb3;color:#43ceb3;font-size:16px;letter-spacing:0;clip-path:polygon(0 0,100% 0,100% 75%,75% 100%,0 100%)}
        .gev-top-actions{display:flex;align-items:center;gap:22px}.gev-live{font-size:9px;font-weight:700;letter-spacing:.15em;color:#91a6b1}.gev-live i{display:inline-block;width:6px;height:6px;background:#57e1ba;border-radius:50%;margin-right:7px;box-shadow:0 0 10px #57e1ba}
        .gev-top-actions button{background:#101b22;border:1px solid #30424d;color:#b9cbd5;padding:9px 12px;font-size:9px;letter-spacing:.12em;font-weight:700;border-radius:4px}
        .gev-layout{flex:1;min-height:0;display:grid;grid-template-columns:330px minmax(0,1fr)}
        .gev-sidebar{background:#0b1117;border-right:1px solid #25323c;min-height:0;overflow:auto;padding:22px 18px 12px}
        .gev-eyebrow{font-size:9px;letter-spacing:.19em;color:#5acfb7;font-weight:700;margin:0 0 10px}.gev-sidebar h1{font-size:23px;font-weight:500;letter-spacing:-.04em;margin:0 0 7px;color:#e7f0f5}.gev-subtitle{font-size:11px;line-height:1.6;color:#82939e;margin:0 0 20px}
        .gev-search{height:38px;border:1px solid #263640;border-radius:5px;background:#0e171e;display:flex;align-items:center;gap:9px;padding:0 11px;color:#6c8794;margin-bottom:20px}.gev-search span{font-size:22px}.gev-search input{outline:0;border:0;background:transparent;min-width:0;color:#dbe7ed;font-size:11px;width:100%}.gev-search input::placeholder{color:#5f737f}
        .gev-panel{border:1px solid #24323b;border-radius:6px;padding:12px;margin-bottom:12px;background:#0d151c}.gev-panel-heading{display:flex;justify-content:space-between;font-size:8px;letter-spacing:.15em;color:#718995;font-weight:700;padding-bottom:12px;border-bottom:1px solid #223039;margin-bottom:3px}.gev-panel-heading span:last-child{color:#4fc7ad}
        .gev-layer{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #1d2a32;gap:12px}.gev-layer:last-child{border-bottom:0;padding-bottom:1px}.gev-layer-main{display:flex;align-items:center;gap:9px;min-width:0}.gev-layer-dot{width:7px;height:7px;border-radius:2px;flex:none}.gev-layer-label{font-size:11px;color:#c9d7df}.gev-layer-detail{font-size:8px;display:block;margin-top:4px;color:#637783;letter-spacing:.04em}.gev-switch{width:28px;height:15px;flex:none;border:1px solid #31424d;background:#18242b;border-radius:20px;padding:2px;text-align:left}.gev-switch[aria-pressed="true"]{border-color:#327d70;background:#17453d}.gev-switch span{height:9px;width:9px;display:block;border-radius:50%;background:#60727c;transition:transform .15s}.gev-switch[aria-pressed="true"] span{transform:translateX(11px);background:#5be0c1}
        .gev-status-row{display:flex;justify-content:space-between;gap:8px;padding:7px 0;font-size:10px}.gev-status-row span:first-child{color:#889ba5}.gev-status-row span:last-child{color:#c6d7df;text-align:right}.gev-status-row .is-live{color:#5ed8b6!important}.gev-status-row .is-unavailable{color:#f0a078!important}
        .gev-contacts{padding-bottom:5px}.gev-contact{width:100%;display:flex;align-items:center;gap:8px;text-align:left;padding:10px 0;background:transparent;border:0;border-bottom:1px solid #1d2a32;color:inherit;cursor:pointer}.gev-contact.selected{background:#142a2b}.gev-contact-dot{width:6px;height:6px;border-radius:50%;flex:none}.gev-contact-dot.aircraft{background:#60e5d1}.gev-contact-dot.earthquake{background:#ff8b62}.gev-contact-dot.satellite{background:#a3b5ff}.gev-contact-copy{min-width:0;flex:1}.gev-contact-copy strong{display:block;font-size:10px;font-weight:600;color:#d6e2e8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gev-contact-copy small{display:block;margin-top:4px;font-size:8px;line-height:1.4;color:#718691;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gev-contact-arrow{font-size:12px;color:#66818f}.gev-empty{font-size:10px;line-height:1.7;color:#718691}.gev-disclaimer{font-size:8px;line-height:1.65;color:#5b6d78;margin:3px 2px 8px}
        .gev-viewport{position:relative;min-width:0;min-height:0;background:radial-gradient(ellipse at 50% 45%,#16323c,#080d12 67%);overflow:hidden}.gev-globe{position:absolute;inset:0}.gev-globe .cesium-viewer,.gev-globe .cesium-viewer-cesiumWidgetContainer,.gev-globe .cesium-widget,.gev-globe canvas{width:100%;height:100%}.gev-globe .cesium-viewer-bottom{display:none}.gev-hud{position:absolute;left:18px;right:18px;pointer-events:none;display:flex;justify-content:space-between;gap:16px;color:#8babb7;font-size:8px;font-weight:700;letter-spacing:.14em;text-shadow:0 1px 5px #000}.gev-hud-top{top:17px}.gev-hud-bottom{bottom:15px;color:#617d89}.gev-error{position:absolute;top:50px;left:18px;right:18px;background:#311d1b;border:1px solid #67392e;padding:12px;color:#ffc4ae;font-size:12px;border-radius:5px}
        .gev-selected{position:absolute;right:20px;top:52px;width:min(270px,calc(100% - 40px));padding:17px;border:1px solid #34515b;border-radius:6px;background:rgba(9,17,23,.94);box-shadow:0 10px 30px #0005;backdrop-filter:blur(14px)}.gev-selected>button{position:absolute;right:10px;top:8px;color:#a9bec8;font-size:19px;background:transparent;border:0}.gev-selected h2{font-size:16px;line-height:1.3;margin:0 20px 7px 0;font-weight:500}.gev-selected p:not(.gev-eyebrow){font-size:11px;line-height:1.5;color:#94a9b4}.gev-selected small{font-size:10px;color:#5dcfb6}.gev-selected a{display:block;font-size:10px;color:#5dcfb6;margin-top:12px}
        @media(max-width:800px){.gev-shell{height:100dvh;min-height:0}.gev-topbar{height:56px;padding:0 12px}.gev-top-actions{gap:9px}.gev-live{display:none}.gev-layout{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(190px,34dvh) minmax(0,1fr)}.gev-sidebar{grid-row:2;border-right:0;border-top:1px solid #25323c;padding:12px;overflow:auto}.gev-sidebar>section:first-child{display:none}.gev-search{margin-bottom:10px}.gev-panel{margin-bottom:9px}.gev-viewport{grid-row:1}.gev-contact{padding:8px 0}.gev-disclaimer{margin-top:6px}.gev-hud{left:10px;right:10px}.gev-selected{top:42px;right:10px}.gev-sidebar h1{font-size:18px}}
        @media(prefers-reduced-motion:reduce){.gev-switch span{transition:none}}
      `}</style>
    </main>
  );
}

function LayerToggle({ label, detail, color, checked, onChange }: {
  label: string; detail: string; color: string; checked: boolean; onChange: () => void;
}) {
  return (
    <div className="gev-layer">
      <div className="gev-layer-main">
        <span className="gev-layer-dot" style={{ background: color }} />
        <span className="gev-layer-label">{label}<small className="gev-layer-detail">{detail}</small></span>
      </div>
      <button type="button" className="gev-switch" aria-pressed={checked} aria-label={`${label} layer`} onClick={onChange}><span /></button>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  const statusClass = value === 'Live' ? 'is-live' : value === 'Unavailable' ? 'is-unavailable' : '';
  return <div className="gev-status-row"><span>{label}</span><span className={statusClass}>{value}</span></div>;
}
