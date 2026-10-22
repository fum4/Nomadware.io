import { CONTACT } from '../../constants';
import { SITE } from '../../config/site';
import { hasFinePointer, isMobileViewport, onceVisible } from '../motion';
import { caretOnFirstLine } from './caret-edge';
import type { ContactLine } from './contact-line';
import { readLines } from './contact-line';
import { mailtoUrl } from './mailto';
import { paintLine } from './paint-line';
import { isComplete, isEmail } from './validation';
import type { ContactDraft } from './validation';

const STATE = { idle: 'is-idle', typing: 'is-typing', ready: 'is-ready' } as const;

function setFieldError(line: ContactLine, on: boolean): void {
  if (!line.error) return;
  line.error.classList.toggle('is-on', on);
  line.error.textContent = on ? (line.error.dataset.error ?? '') : '';
  line.control.setAttribute('aria-invalid', String(on));
}

export function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>('[data-contact]');
  const output = form?.querySelector<HTMLElement>('[data-output]');
  if (!form || !output) return;
  form.noValidate = true;
  const lines = readLines(form);
  let typingTimer = 0;

  const draft = (): ContactDraft => {
    const [name = '', email = '', brief = ''] = lines.map((line) => line.control.value);
    return { name, email, brief };
  };
  const showsCaret = (line: ContactLine): boolean =>
    document.activeElement === line.control ||
    (form.classList.contains(STATE.idle) && line === lines[0]);
  const paint = (line: ContactLine, fresh = false): void =>
    paintLine(line, showsCaret(line), fresh);

  const say = (tone: 'is-ok' | 'is-bad', mark: string, message: string): void => {
    const symbol = document.createElement('span');
    symbol.className = tone;
    symbol.textContent = mark;
    output.replaceChildren(symbol, ` ${message}`);
    output.classList.add('is-on');
  };

  const send = (): void => {
    const current = draft();
    if (!isComplete(current)) {
      say('is-bad', '✗', 'name, a valid email and a few words about the project, please');
      return;
    }
    window.location.href = mailtoUrl(SITE.email, current);
    say('is-ok', '✓', `opening your mail app with a draft to ${SITE.email}. hit send there.`);
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
    const isEmailLine = line.root.dataset.field === 'email';
    paint(line);

    control.addEventListener('focus', () => {
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
      if (isEmailLine) setFieldError(line, control.value.length > 0 && !isEmail(control.value));
    });
    control.addEventListener('input', () => {
      form.classList.add(STATE.typing);
      clearTimeout(typingTimer);
      typingTimer = window.setTimeout(
        () => form.classList.remove(STATE.typing),
        CONTACT.typingIdleMs,
      );
      paint(line, true);
      form.classList.toggle(STATE.ready, isComplete(draft()));
      if (isEmailLine && isEmail(control.value)) setFieldError(line, false);
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
        send();
      } else if (event.key === 'Enter' && control instanceof HTMLInputElement) {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === 'ArrowUp' && index > 0 && caretOnFirstLine(line)) {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === 'ArrowDown' && control instanceof HTMLInputElement) {
        event.preventDefault();
        goTo(index + 1);
      }
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    send();
  });

  // Desktop: type straight away once the form is in view. Phones: never (the keyboard would
  // cover the page); the idle caret on "name" still shows where to start.
  if (hasFinePointer() && !isMobileViewport()) {
    onceVisible(form, CONTACT.autoFocusThreshold, () => {
      if (document.activeElement && document.activeElement !== document.body) return;
      lines[0]?.control.focus({ preventScroll: true });
    });
  }
}
