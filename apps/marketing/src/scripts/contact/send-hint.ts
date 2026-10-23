import { CONTACT } from '../../constants';
import { isApplePlatform } from '../motion';

/** Name the send shortcut's modifier the visitor actually has: Ctrl off Apple devices. */
export function initSendHint(): void {
  if (isApplePlatform()) return;
  const keys = document.querySelector<HTMLElement>('[data-send-keys]');
  if (keys) keys.textContent = CONTACT.sendKeys.other;
}
