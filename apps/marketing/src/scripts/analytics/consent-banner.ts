import { BANNER_DELAY_MS } from './constants';
import type { Consent } from './consent-store';
import { readConsent, writeConsent } from './consent-store';
import { applyConsent } from './posthog-client';

/** consent-banner.astro: the details drawer's expanded state (animated there). */
const OPEN_CLASS = 'is-open';

const isConsent = (value: string | undefined): value is Consent =>
  value === 'granted' || value === 'denied';

/**
 * The consent card. First visit: it appears after BANNER_DELAY_MS or on the first scroll, without
 * taking focus. Footer "privacy" reopens it (and focuses it, since the visitor asked). A choice
 * is the only way to dismiss it; there is no close button and Escape does nothing.
 */
export function initConsentBanner(): void {
  const banner = document.querySelector<HTMLElement>('[data-consent]');
  const more = banner?.querySelector<HTMLButtonElement>('[data-consent-more]');
  const details = banner?.querySelector<HTMLElement>('[data-consent-details]');
  if (!banner || !more || !details) return;
  const choices = [...banner.querySelectorAll<HTMLButtonElement>('[data-consent-choice]')];
  let returnFocus: HTMLElement | undefined;

  const expand = (open: boolean): void => {
    details.classList.toggle(OPEN_CLASS, open);
    details.inert = !open;
    more.setAttribute('aria-expanded', String(open));
    more.textContent = (open ? more.dataset.less : more.dataset.more) ?? '';
  };

  const show = (): void => {
    if (!banner.hidden) return;
    banner.hidden = false;
    // Commit the hidden→shown layout first so the fade-in transition runs.
    void banner.offsetWidth;
    banner.classList.add('is-on');
  };

  const hide = (): void => {
    banner.classList.remove('is-on');
    banner.hidden = true;
    expand(false);
  };

  more.addEventListener('click', () => expand(more.getAttribute('aria-expanded') !== 'true'));

  choices.forEach((button) =>
    button.addEventListener('click', () => {
      const consent = button.dataset.consentChoice;
      if (!isConsent(consent)) return;
      writeConsent(consent);
      applyConsent(consent);
      hide();
      returnFocus?.focus();
      returnFocus = undefined;
    }),
  );

  document.querySelectorAll<HTMLElement>('[data-consent-open]').forEach((opener) =>
    opener.addEventListener('click', () => {
      returnFocus = opener;
      show();
      choices[0]?.focus();
    }),
  );

  if (readConsent()) return;
  const showOnce = (): void => {
    clearTimeout(timer);
    window.removeEventListener('scroll', showOnce);
    show();
  };
  const timer = window.setTimeout(showOnce, BANNER_DELAY_MS);
  window.addEventListener('scroll', showOnce, { passive: true, once: true });
}
