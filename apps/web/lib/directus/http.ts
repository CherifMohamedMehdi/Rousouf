/**
 * Minimal authenticated fetch for Directus REST (`/items/...`).
 * Used when `DIRECTUS_URL` + `DIRECTUS_TOKEN` are set (non-mock mode).
 */

function authHeaders(): HeadersInit {
  const token = process.env.DIRECTUS_TOKEN;
  return {
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

export async function directusGetJson<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.DIRECTUS_URL;
  if (!base) throw new Error('DIRECTUS_URL is not set');
  const url = path.startsWith('http') ? path : `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers as Record<string, string>),
    },
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`Directus ${path}: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export type DirectusListMeta = {
  filter_count?: number;
  total_count?: number;
};

export async function directusListItems<T = Record<string, unknown>>(
  collection: string,
  searchParams?: Record<string, string>,
): Promise<T[]> {
  const { data } = await directusListItemsWithMeta<T>(collection, searchParams);
  return data;
}

/** Same as `directusListItems` but returns `meta` (e.g. `filter_count` when `meta=filter_count` is passed). */
export async function directusListItemsWithMeta<T = Record<string, unknown>>(
  collection: string,
  searchParams?: Record<string, string>,
): Promise<{ data: T[]; meta: DirectusListMeta }> {
  const base = process.env.DIRECTUS_URL!.replace(/\/$/, '');
  const u = new URL(`/items/${collection}`, `${base}/`);
  for (const [k, v] of Object.entries(searchParams ?? {})) {
    u.searchParams.set(k, v);
  }
  const path = `${u.pathname}${u.search}`;
  const json = await directusGetJson<{ data: T[]; meta?: DirectusListMeta }>(path);
  return { data: json.data ?? [], meta: json.meta ?? {} };
}

export async function directusGetSingleton<T>(
  collection: string,
  options?: { fields?: string },
): Promise<T | null> {
  const fieldsParam = options?.fields ? `?fields=${encodeURIComponent(options.fields)}` : '';
  try {
    const json = await directusGetJson<{ data: T }>(`/items/${collection}${fieldsParam}`);
    if (json?.data) return json.data;
  } catch {
    // Fallback to list query for non-singleton-like endpoints.
  }
  const rows = await directusListItems<T>(collection, {
    limit: '1',
    fields: options?.fields ?? '*',
  });
  return rows[0] ?? null;
}

export async function directusGetItem<T>(collection: string, id: string): Promise<T | null> {
  try {
    const json = await directusGetJson<{ data: T }>(`/items/${collection}/${encodeURIComponent(id)}`);
    return json.data ?? null;
  } catch {
    return null;
  }
}
