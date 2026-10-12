# God's Eye View on TripSignal

This integration adds a full-page, experimental public-data 3D globe to TripSignal at `/gods-eye-view`.

## Scope

- Browser-based Cesium globe with terrain where the provider allows it.
- Public ADS-B aircraft data via adsb.lol and USGS earthquake GeoJSON.
- Layer visibility, search, contact list, target tracking, and feed health.
- No user identity tracking and no private-person search features.

## Limitations and setup

The integrated page is an initial implementation, not a port of the entire upstream application. The complete upstream project includes a much broader set of layers, server-side provider adapters, optional API keys, offline assets, and a large test suite.

This page loads CesiumJS from its public CDN and attempts to use Cesium World Terrain. Terrain availability may require a Cesium ion token and provider-compliant configuration. If terrain fails, the page may show a Cesium error while the rest of TripSignal continues to work.

The aircraft demo queries an approximate area around the central United States. Refresh occurs every 90 seconds. Provider availability, rate limits, CORS policy, and data freshness are outside TripSignal's control.

The code is provided under the upstream repository's MIT license. This compact integration is new code, not a copy of upstream source files. Upstream datasets, imagery, and models are not bundled.
