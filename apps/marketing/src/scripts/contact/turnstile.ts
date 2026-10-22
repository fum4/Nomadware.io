import { TURNSTILE } from '../../constants';

// Cloudflare Turnstile, loaded only once someone starts on the form (first focus), so the page
// itself ships no third-party script. Managed mode, `interaction-only`: invisible unless
// Cloudflare wants a click. Tokens are single-use, so every send takes a fresh one.

interface TurnstileOptions {
  sitekey: string;
  action: string;
  appearance: string;
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
}

interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileOptions): string | undefined;
  reset(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface Challenge {
  /** Start loading the script and solving in the background (idempotent). */
  warm(): void;
  /** A fresh token; rejects if none arrives within `timeoutMs` (script blocked, challenge failed). */
  token(timeoutMs: number): Promise<string>;
  /** Spend the current token: the next `token()` waits for a new one. */
  reset(): void;
}

function loadScript(): Promise<TurnstileApi> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE.scriptUrl;
    script.async = true;
    script.addEventListener('load', () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile: no api')),
    );
    script.addEventListener('error', () => reject(new Error('turnstile: script failed')));
    document.head.append(script);
  });
}

export function createChallenge(container: HTMLElement, sitekey: string): Challenge {
  let widget: Promise<{ api: TurnstileApi; id: string }> | null = null;
  let current: string | null = null;
  let waiters: Array<(token: string | null) => void> = [];

  const settle = (token: string | null): void => {
    current = token;
    waiters.forEach((wake) => wake(token));
    waiters = [];
  };

  const mount = (): Promise<{ api: TurnstileApi; id: string }> =>
    loadScript().then((api) => {
      const id = api.render(container, {
        sitekey,
        action: TURNSTILE.action,
        appearance: TURNSTILE.appearance,
        callback: (token) => settle(token),
        'expired-callback': () => {
          current = null;
        },
        'error-callback': () => settle(null),
      });
      if (id === undefined) throw new Error('turnstile: render failed');
      return { api, id };
    });

  const warm = (): void => {
    widget ??= mount();
    // A failed load is retried on the next warm()/token() rather than cached.
    widget.catch(() => {
      widget = null;
    });
  };

  return {
    warm,
    async token(timeoutMs) {
      warm();
      if (!widget) throw new Error('turnstile: unavailable');
      await widget;
      if (current) return current;
      return new Promise((resolve, reject) => {
        const timer = window.setTimeout(() => {
          waiters = waiters.filter((waiter) => waiter !== wake);
          reject(new Error('turnstile: timed out'));
        }, timeoutMs);
        const wake = (token: string | null): void => {
          clearTimeout(timer);
          if (token) resolve(token);
          else reject(new Error('turnstile: challenge error'));
        };
        waiters.push(wake);
      });
    },
    reset() {
      current = null;
      void widget?.then(({ api, id }) => api.reset(id)).catch(() => undefined);
    },
  };
}
