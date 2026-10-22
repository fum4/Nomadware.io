import { CONSENT_STORAGE_KEY } from './constants';

export type Consent = 'granted' | 'denied';

const isConsent = (value: unknown): value is Consent => value === 'granted' || value === 'denied';

/** The stored choice, or `undefined` when the visitor hasn't chosen (or storage is blocked). */
export function readConsent(): Consent | undefined {
  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY);
    return isConsent(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function writeConsent(consent: Consent): void {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, consent);
  } catch {
    // Storage blocked: the choice holds for this page view only, and the banner asks again.
  }
}
