import type { FlightProvider } from './types';

class UnconfiguredFlightProvider implements FlightProvider {
  readonly name = 'unconfigured';

  async search(): Promise<never> {
    throw new Error(
      'No flight data provider is configured. TripSignal is intentionally not using a Google Flights scraper in production.'
    );
  }
}

export function getFlightProvider(): FlightProvider {
  return new UnconfiguredFlightProvider();
}
