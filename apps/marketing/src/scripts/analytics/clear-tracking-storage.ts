import { POSTHOG_STORAGE_PREFIXES } from './constants';

const isPostHogKey = (key: string): boolean =>
  POSTHOG_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));

/** The host and each parent domain: posthog-js sets its cookie on the widest one it can. */
function cookieDomains(): string[] {
  const labels = location.hostname.split('.');
  return labels.slice(0, -1).map((_, index) => labels.slice(index).join('.'));
}

function clearStore(store: Storage): void {
  for (const key of Object.keys(store)) if (isPostHogKey(key)) store.removeItem(key);
}

/** Remove everything posthog-js may have stored on the device (after a "no thanks"). */
export function clearTrackingStorage(): void {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim() ?? '';
    if (!isPostHogKey(name)) continue;
    const expire = `${name}=; Max-Age=0; Path=/`;
    document.cookie = expire;
    for (const domain of cookieDomains()) document.cookie = `${expire}; Domain=${domain}`;
  }
  try {
    clearStore(localStorage);
    clearStore(sessionStorage);
  } catch {
    // Storage blocked: nothing can have been written there either.
  }
}
