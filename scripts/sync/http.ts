/** Polite HTTP: timeout, retries with backoff (honouring Retry-After), bounded concurrency. */

const USER_AGENT = 'rostrum-sync/0.1 (open data sync; static site build)';

export class HttpError extends Error {
  constructor(public readonly status: number, url: string) {
    super(`HTTP ${status} for ${url}`);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchText(url: string, init: { accept?: string; retries?: number; timeoutMs?: number } = {}): Promise<string> {
  const { accept = 'application/json', retries = 4, timeoutMs = 30_000 } = init;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: accept, 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(timeoutMs) });
      if (res.ok) return await res.text();
      // 4xx other than 408/429 will not improve on retry.
      if (res.status < 500 && res.status !== 408 && res.status !== 429) throw new HttpError(res.status, url);
      if (attempt >= retries) throw new HttpError(res.status, url);
      const retryAfter = Number(res.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt);
    } catch (err) {
      if (err instanceof HttpError && err.status < 500 && err.status !== 408 && err.status !== 429) throw err;
      if (attempt >= retries) throw err;
      await sleep(1000 * 2 ** attempt);
    }
  }
}

export async function fetchJson<T>(url: string, init?: Parameters<typeof fetchText>[1]): Promise<T> {
  return JSON.parse(await fetchText(url, init)) as T;
}

/** Map with at most `limit` promises in flight; preserves input order; rejects on the first failure. */
export async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!, i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
