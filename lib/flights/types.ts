export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

export type DestinationScope =
  | { type: 'anywhere' }
  | { type: 'region'; value: string }
  | { type: 'country'; value: string }
  | { type: 'city'; value: string }
  | { type: 'airport'; value: string }
  | { type: 'airports'; value: string[] };

export interface FlightSearchCriteria {
  origin: string;
  destination: DestinationScope;
  maxPrice: number;
  cabin: CabinClass;
  airlines: string[];
  maxStops: number | null;
  minTripDays: number;
  maxTripDays: number;
  departureStart: string;
  departureEnd: string;
  passengers: number;
}

export interface FlightSegment {
  marketingCarrier: string;
  operatingCarrier: string;
  flightNumber?: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
}

export interface FlightOffer {
  id: string;
  price: number;
  currency: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  stops: number;
  totalDurationMinutes?: number;
  segments: FlightSegment[];
  bookingUrl?: string;
  source: string;
}

export interface FlightProvider {
  readonly name: string;
  search(criteria: FlightSearchCriteria): Promise<FlightOffer[]>;
}
