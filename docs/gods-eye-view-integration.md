# God's Eye View on TripSignal

This integration adds a full-page, experimental public-data 3D globe to TripSignal at `/gods-eye-view`.

## Scope

- Browser-based Cesium globe on an ellipsoid terrain provider. It does not require a Cesium ion token.
- Public ADS-B aircraft data via adsb.lol and USGS earthquake GeoJSON.
- Layer visibility, search, contact list, target tracking, and feed health.
- No user identity tracking and no private-person search features.

## Limitations

The integrated page is an initial implementation, not a port of the entire upstream application. The complete upstream project includes a broader set of layers, server-side provider adapters, optional API keys, offline assets, and a large test suite.

The aircraft view queries an approximate area around the central United States and refreshes every 90 seconds. Provider availability, rate limits, CORS policy, and data freshness are outside TripSignal's control. Satellite and places/infrastructure layers are not connected in this build and are labeled accordingly in the UI.

The code is provided under the upstream repository's MIT license. This compact integration is new code, not a copy of upstream source files. Upstream datasets, imagery, and models are not bundled.
