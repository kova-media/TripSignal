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

function dealsSql() {
  return `
  with ranked as (
    select id, origin, destination_mode, destination, trip_type, cabin,
           departure_date, return_date, destination_airport,
           price::float as price, observed_at,
           row_number() over (
             partition by origin, destination_mode, destination, trip_type, cabin,
                          departure_date, return_date, destination_airport
             order by observed_at desc, id desc
           ) as rn
    from fare_observations
    where origin is not null and destination is not null
      and ($1::text is null or origin = $1)
      and ($2::text is null or cabin = $2)
  ),
  latest as (select * from ranked where rn = 1 and observed_at > now() - ($3::int * interval '1 day')),
  previous as (select * from ranked where rn = 2 and observed_at > now() - ($3::int * interval '1 day'))
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
   and p.departure_date is not distinct from l.departure_date
   and p.return_date is not distinct from l.return_date
   and p.destination_airport is not distinct from l.destination_airport
  where p.price > l.price and p.price > 0
    and (((p.price - l.price) / nullif(p.price, 0)) * 100 >= 3 or (p.price - l.price) >= 25)
  order by "dropPercent" desc
  limit 10
`;
}

const DEALS_SQL = dealsSql();

export async function getDeals(filters?: { origin?: string; cabin?: string }): Promise<Deal[]> {
  await ensureSchema();
  const result = await getDb().query<Deal>(DEALS_SQL, [filters?.origin ?? null, filters?.cabin ?? null, 7]);
  return result.rows;
}

// Latest drops seen in the last 30 days, shown only when nothing dropped
// in the last 7 — so the page has something real instead of an empty state.
export async function getRecentDeals(filters?: { origin?: string; cabin?: string }): Promise<Deal[]> {
  await ensureSchema();
  const result = await getDb().query<Deal>(DEALS_SQL, [filters?.origin ?? null, filters?.cabin ?? null, 30]);
  return result.rows;
}

// Origins with a deal in the last 30 days, plus origins with any recent
// observation in the last 30 days — so the filter list never shows stale
// origins from trips long since gone quiet.
export async function getDealOrigins(): Promise<string[]> {
  await ensureSchema();
  const [deals, recent] = await Promise.all([
    getRecentDeals(),
    getDb().query<{ origin: string }>(`select distinct origin from fare_observations where origin is not null and observed_at > now() - interval '30 days' order by origin asc`),
  ]);
  const origins = new Set<string>([...deals.map((deal) => deal.origin), ...recent.rows.map((row) => row.origin)]);
  return [...origins].sort();
}
