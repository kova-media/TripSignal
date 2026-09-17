import SiteHeader from '@/components/site-header';
import { getDb, ensureSchema } from '@/lib/db';
import { loungeDirectoryLinks, normalizeAirportCode } from '@/lib/lounges';
import styles from './lounges.module.css';

export const dynamic = 'force-dynamic';

export default async function LoungesPage({ searchParams }: { searchParams: Promise<{ airport?: string }> }) {
  const params = await searchParams;
  const airport = normalizeAirportCode(params.airport);
  let lounges: Array<{ id: string; name: string; terminal: string | null; location: string | null; airside: boolean | null; access_methods: string[]; membership_required: boolean | null; day_pass_price: string | null; hourly_price: string | null; max_stay: string | null; amenities: string[]; guest_policy: string | null; hours: string | null; source_name: string | null; source_url: string | null; last_verified_at: string | null }> = [];

  if (airport) {
    await ensureSchema();
    const db = getDb();
    const result = await db.query<typeof lounges[number]>(
      `select id, name, terminal, location, airside, access_methods, membership_required,
              day_pass_price, hourly_price, max_stay, amenities, guest_policy, hours,
              source_name, source_url, last_verified_at
       from airport_lounges where airport = $1 order by name`,
      [airport],
    );
    lounges = result.rows;
  }

  const directories = loungeDirectoryLinks(airport);

  return (
    <main className="shell">
      <SiteHeader backHref="/" backLabel="Home" />
      <section className={styles.page}>
        <p className="eyebrow">TripSignal</p>
        <h1>Airport lounge guide.</h1>
        <p className={styles.intro}>See which lounges can work for a departure or layover, how you can get in, what they cost and what is included.</p>

        <form className={styles.search} action="/lounges">
          <label htmlFor="airport">Airport</label>
          <div><input id="airport" name="airport" defaultValue={airport} placeholder="ATL" maxLength={3} autoComplete="off" /><button type="submit">View lounges</button></div>
        </form>

        {airport ? (
          <>
            <div className={styles.heading}><div><span>Airport</span><strong>{airport}</strong></div><small>Data is shown only when it has a current source.</small></div>
            {lounges.length > 0 ? lounges.map((lounge) => (
              <article className={styles.lounge} key={lounge.id}>
                <div className={styles.loungeTop}><div><h2>{lounge.name}</h2>{lounge.terminal && <span>{lounge.terminal}</span>}</div>{lounge.airside != null && <b>{lounge.airside ? 'Airside' : 'Landside'}</b>}</div>
                <div className={styles.facts}>
                  {lounge.membership_required != null && <span>{lounge.membership_required ? 'Membership required' : 'No membership required'}</span>}
                  {lounge.day_pass_price && <span>Day pass {lounge.day_pass_price}</span>}
                  {lounge.hourly_price && <span>Hourly {lounge.hourly_price}</span>}
                  {lounge.max_stay && <span>Up to {lounge.max_stay}</span>}
                </div>
                {lounge.amenities.length > 0 && <p>{lounge.amenities.join(' · ')}</p>}
                {lounge.hours && <p>Hours: {lounge.hours}</p>}
                {lounge.guest_policy && <p>Guests: {lounge.guest_policy}</p>}
                {lounge.source_url && <a href={lounge.source_url} target="_blank" rel="noreferrer">Verify current details</a>}
              </article>
            )) : (
              <div className={styles.empty}><strong>TripSignal does not have verified lounge records for {airport} yet.</strong><p>The guide is tied to actual flight itineraries, so layover airports can be surfaced automatically. For now, these are the live directories TripSignal uses as source references.</p><div>{directories.map((directory) => <a key={directory.name} href={directory.url} target="_blank" rel="noreferrer">{directory.name}</a>)}</div></div>
            )}

            <section className={styles.access}><span>ACCESS OVERVIEW</span><h2>Ways to get into a lounge</h2><div className={styles.accessGrid}><article><strong>Priority Pass</strong><p>Membership plans can provide lounge access, with visit fees depending on the plan. Access is subject to lounge capacity.</p><a href="https://www.prioritypass.com/en-GB/join-prioritypass" target="_blank" rel="noreferrer">Check current plans</a></article><article><strong>Paid entry</strong><p>Some lounge operators sell day passes or timed access. Availability and pricing vary by airport and lounge.</p><a href="https://www.plazapremiumlounge.com/passes" target="_blank" rel="noreferrer">Check lounge passes</a></article><article><strong>Airline or card access</strong><p>Business or first class tickets, airline status and eligible credit cards can provide access at specific lounges. The rules are lounge-specific.</p></article></div></section>
          </>
        ) : (
          <div className={styles.empty}><strong>Enter an airport code to start.</strong><p>When a watch has an observed itinerary, TripSignal can also surface the actual layover airport automatically.</p></div>
        )}
      </section>
    </main>
  );
}
