import { getDb, ensureSchema } from '@/lib/db';

export type Deal = {
  origin: string;
  destination: string;
  destinationMode: string | null;
  cabin: string | null;
  tripType: string | null;
  latestPrice: number;
  previousPrice: number;
  dropPercent: number;
  observedAt: string;
};

const DEALS_SQL = `
  with ranked as (
    select origin, destination_mode, destination, trip_type, cabin,
           price::float as price, observed_at,
           row_number() over (
             partition by origin, destination_mode, destination, trip_type, cabin
             order by observed_at desc
           ) as rn
    from fare_observations
    where origin is not null and destination is not null
  ),
  latest as (select * from ranked where rn = 1 and observed_at > now() - interval '7 days'),
  previous as (select * from ranked where rn = 2)
  select l.origin,
         l.destination_mode as "destinationMode",
         l.destination,
         l.trip_type as "tripType",
         l.cabin,
         l.price as "latestPrice",
         p.price as "previousPrice",
         round((((p.price - l.price) / nullif(p.price, 0)) * 100)::numeric, 1)::float as "dropPercent",
         l.observed_at as "observedAt"
  from latest l
  join previous p
    on p.origin = l.origin
   and p.destination_mode is not distinct from l.destination_mode
   and p.destination = l.destination
   and p.trip_type is not distinct from l.trip_type
   and p.cabin is not distinct from l.cabin
  where p.price > l.price and p.price > 0
  order by "dropPercent" desc
  limit 10
`;

export async function getDeals(): Promise<Deal[]> {
  await ensureSchema();
  const result = await getDb().query<Deal>(DEALS_SQL);
  return result.rows;
}
