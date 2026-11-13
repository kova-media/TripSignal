// Shared watch definitions. Profile, account, and GET /api/watches must
// agree on what counts as a watch, so all three filter through these
// helpers instead of each re-implementing the checks in SQL.
//
// A "valid watch" is a non-deleted alert whose criteria parses and
// describes a real destination (not a placeholder "any destination" /
// "any airport"). An "active watch" is a valid watch that is switched on
// (active=true) and not awaiting email verification (pending_verification).
// Paused watches are valid but not active, so they still show in the
// profile/account lists with a Paused status.
//
// NOTE: the monthly usage count is deliberately NOT an active-watch count:
// it counts ALL alerts created this month, including soft-deleted ones,
// so deleting and recreating a watch cannot reset the free cap.

export type WatchRow = {
  active?: boolean | null;
  deleted_at?: string | null;
  pending_verification?: boolean | null;
  criteria?: unknown;
};

function parseCriteria(criteria: unknown): Record<string, unknown> | null {
  let value: unknown = criteria;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function destinationValue(criteria: Record<string, unknown>): string | null {
  const raw = criteria.destination;
  if (typeof raw === 'string') return raw.trim().toLowerCase();
  if (typeof raw === 'object' && raw !== null) {
    const value = (raw as Record<string, unknown>).value;
    if (typeof value === 'string') return value.trim().toLowerCase();
  }
  return null;
}

export function isValidWatch(row: WatchRow): boolean {
  if (row.deleted_at != null) return false;
  const criteria = parseCriteria(row.criteria);
  if (!criteria) return false;
  const origin = typeof criteria.origin === 'string' ? criteria.origin.trim() : '';
  if (origin.length !== 3) return false;
  if (!('destination' in criteria) || !('maxPrice' in criteria)) return false;
  const destination = destinationValue(criteria);
  if (!destination) return false;
  if (destination === 'any destination' || destination === 'any airport') return false;
  return true;
}

export function isActiveWatch(row: WatchRow): boolean {
  return row.active === true && row.pending_verification !== true && isValidWatch(row);
}
