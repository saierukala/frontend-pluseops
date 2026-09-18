/**
 * Query parameter serialization — F04
 * Reusable for all feature API modules. Backend conventions (handoff §17):
 *   page, limit, search, status, sortBy, sortOrder, from, to, etc.
 *   - page/limit are positive ints
 *   - filters are optional strings/UUIDs/enums
 *   - arrays (if any) are serialized as repeated keys (?a=1&a=2)
 */

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export type QueryParams = Record<string, QueryValue>;

function isEmptyValue(v: unknown): boolean {
  return v === undefined || v === null || v === "";
}

export function serializeQuery(params: QueryParams): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (isEmptyValue(value)) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isEmptyValue(item)) continue;
        sp.append(key, String(item));
      }
      continue;
    }
    // Date objects: serializer caller should convert to ISO string explicitly
    sp.append(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Build a URL path with query string, e.g. buildUrl("/products", {page:1,limit:20})
 */
export function buildUrl(path: string, params?: QueryParams): string {
  if (!params) return path;
  return `${path}${serializeQuery(params)}`;
}
