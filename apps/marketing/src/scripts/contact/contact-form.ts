import { CONTACT } from '../../constants';
import { isComplete } from '../../contact/validation';
import type { ContactDraft } from '../../contact/validation';
import { track } from '../analytics/track';
import { hasFinePointer, isMobileViewport, onceVisible } from '../motion';
import { caretOnFirstLine } from './caret-edge';
import type { ContactLine } from './contact-line';
import { readLines } from './contact-line';
import type { SendFailure } from './failure-message';
import { failureMessage } from './failure-message';
import { createOutput } from './form-output';
import { paintLine } from './paint-line';
import { postContact } from './post-contact';
import type { Reveal } from './problem-reveal';
import { QUIET, revealAll, revealField, shownProblems } from './problem-reveal';
import { createChallenge } from './turnstile';

const STATE = { idle: 'is-idle', typing: 'is-typing', ready: 'is-ready' } as const;

export function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>('[data-contact]');
  const output = form?.querySelector<HTMLElement>('[data-output]');
  const button = form?.querySelector<HTMLButtonElement>('.term-send');
  const trap = form?.querySelector<HTMLInputElement>('input[name="website"]');
  const challengeMount = form?.querySelector<HTMLElement>('[data-challenge]');
  const sitekey = form?.dataset.sitekey;
  if (!form || !output || !button || !trap || !challengeMount || !sitekey) return;
  form.noValidate = true;
  const lines = readLines(form);
  const out = createOutput(output, lines);
  const challenge = createChallenge(challengeMount, sitekey);
  const buttonLabel = button.textContent ?? '';
  let typingTimer = 0;
  let sending = false;
  let reveal: Reveal = QUIET;
  // Analytics: the desktop auto-focus below is not the visitor engaging, so it doesn't count.
  let autoFocusing = false;
  let engaged = false;
  let started = false;
  const markEngaged = (): void => {
    if (engaged) return;
    engaged = true;
    track('contact_form_focused');
  };

  const draft = (): ContactDraft => {
    const [name = '', email = '', brief = ''] = lines.map((line) => line.control.value);
    return { name, email, brief };
  };
  const showsCaret = (line: ContactLine): boolean =>
    document.activeElement === line.control ||
    (form.classList.contains(STATE.idle) && line === lines[0]);
  const paint = (line: ContactLine, fresh = false): void =>
    paintLine(line, showsCaret(line), fresh);
  /** Re-check after any change: the ready state, and the problems line once it may speak. */
  const check = (): void => {
    const current = draft();
    form.classList.toggle(STATE.ready, isComplete(current));
    out.problems(shownProblems(current, reveal));
  };

  const setSending = (on: boolean): void => {
    sending = on;
    button.disabled = on;
    button.textContent = on ? 'sending…' : buttonLabel;
    form.setAttribute('aria-busy', String(on));
  };

  const clearFields = (): void => {
    lines.forEach((line) => {
      line.control.value = '';
      line.root.classList.remove('is-done');
      paint(line);
    });
    reveal = QUIET;
    check();
  };

  const send = async (): Promise<void> => {
    if (sending) return;
    const current = draft();
    if (!isComplete(current)) {
      track('contact_form_failed', { reason: 'validation' });
      reveal = revealAll(reveal);
      check();
      return;
    }
    setSending(true);
    // No token (script blocked, challenge failed, timed out) stays this: the spam-check line.
    let result: { sent: true } | { sent: false; reason: SendFailure } = {
      sent: false,
      reason: 'turnstile',
    };
    try {
      const token = await challenge.token(CONTACT.challengeTimeoutMs);
      track('contact_form_submitted');
      result = await postContact({ ...current, website: trap.value, token });
    } catch {
      // Only challenge.token() throws; postContact never does.
    } finally {
      challenge.reset();
      setSending(false);
    }
    if (result.sent) {
      track('contact_form_succeeded');
      clearFields();
      out.result('is-ok', '✓', `sent. we'll reply to ${current.email.trim()} shortly.`);
    } else {
      track('contact_form_failed', { reason: result.reason });
      out.result('is-bad', '✗', failureMessage(result.reason));
    }
  };

  const goTo = (index: number): void => {
    const line = lines[index];
    if (!line) return;
    line.control.focus();
    const end = line.control.value.length;
    line.control.setSelectionRange(end, end);
    paint(line);
  };

  lines.forEach((line, index) => {
    const { control } = line;
    paint(line);

    control.addEventListener('focus', () => {
      if (!autoFocusing) markEngaged();
      form.classList.remove(STATE.idle);
      lines.forEach((other) => {
        other.root.classList.toggle('is-active', other === line);
        paint(other);
      });
    });
    control.addEventListener('blur', () => {
      line.root.classList.remove('is-active');
      line.root.classList.toggle('is-done', control.value.length > 0);
      paint(line);
      reveal = revealField(reveal, line.field, draft());
      check();
    });
    control.addEventListener('input', () => {
      if (!started) track('contact_form_started');
      started = true;
      form.classList.add(STATE.typing);
      clearTimeout(typingTimer);
      typingTimer = window.setTimeout(
        () => form.classList.remove(STATE.typing),
        CONTACT.typingIdleMs,
      );
      paint(line, true);
      check();
    });
    // Caret moves without typing (arrows, clicks, selection) repaint without the glow.
    // (`control` is an input-or-textarea union, so listeners see plain Events: narrow them.)
    control.addEventListener('keyup', (event) => {
      if (event instanceof KeyboardEvent && event.key.length !== 1) paint(line);
    });
    control.addEventListener('click', () => paint(line));
    control.addEventListener('select', () => paint(line));

    control.addEventListener('keydown', (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        void send();
      } else if (event.key === 'Enter' && control instanceof HTMLInputElement) {
        // Plain Enter on a one-line field does nothing: no accidental submit, no field hop
        // (↑↓ and Tab move). In the brief it inserts a newline as usual.
        event.preventDefault();
      } else if (event.key === 'ArrowUp' && index > 0 && caretOnFirstLine(line)) {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === 'ArrowDown' && control instanceof HTMLInputElement) {
        event.preventDefault();
        goTo(index + 1);
      }
    });
  });

  // After an auto-focus, the first click or key in the form is the visitor's own focus.
  form.addEventListener('pointerdown', markEngaged);
  form.addEventListener('keydown', markEngaged);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void send();
  });
  // Turnstile loads on first contact with the form, never with the page (Lighthouse stays clean).
  form.addEventListener('focusin', () => challenge.warm(), { once: true });

  // Desktop: type straight away once the form is in view. Phones: never (the keyboard would
  // cover the page); the idle caret on "name" still shows where to start.
  if (hasFinePointer() && !isMobileViewport()) {
    onceVisible(form, CONTACT.autoFocusThreshold, () => {
      if (document.activeElement && document.activeElement !== document.body) return;
      autoFocusing = true;
      lines[0]?.control.focus({ preventScroll: true });
      autoFocusing = false;
    });
  }
}
