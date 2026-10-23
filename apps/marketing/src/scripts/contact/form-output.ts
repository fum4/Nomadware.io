import type { ContactProblem } from '../../contact/validation';
import type { ContactLine } from './contact-line';
import { problemMessage } from './problem-message';

type Tone = 'is-ok' | 'is-bad';

/**
 * The terminal's output line (role=status) and the fields it talks about. Problems re-render only
 * when the message changes, so a screen reader hears each new set of problems once, not every
 * keystroke; a send's result stays until the next problem or result replaces it.
 */
export interface FormOutput {
  /** Show what's wrong (or clear a problems line once nothing is) and mark exactly those fields. */
  problems(list: readonly ContactProblem[]): void;
  /** A send's outcome. */
  result(tone: Tone, mark: string, message: string): void;
}

export function createOutput(output: HTMLElement, lines: readonly ContactLine[]): FormOutput {
  let showing: 'problems' | 'result' | null = null;
  let current = '';

  const write = (kind: 'problems' | 'result', tone: Tone, mark: string, message: string): void => {
    showing = kind;
    current = message;
    const symbol = document.createElement('span');
    symbol.className = tone;
    symbol.textContent = mark;
    output.replaceChildren(symbol, ` ${message}`);
    output.classList.add('is-on');
  };

  const clear = (): void => {
    showing = null;
    current = '';
    output.classList.remove('is-on');
    output.replaceChildren();
  };

  const markFields = (list: readonly ContactProblem[]): void => {
    lines.forEach(({ field, root, control }) => {
      const bad = list.some((problem) => problem.field === field);
      root.classList.toggle('is-bad', bad);
      control.setAttribute('aria-invalid', String(bad));
      if (bad) control.setAttribute('aria-describedby', output.id);
      else control.removeAttribute('aria-describedby');
    });
  };

  return {
    problems(list) {
      markFields(list);
      const message = problemMessage(list);
      if (!message) {
        if (showing === 'problems') clear();
      } else if (showing !== 'problems' || message !== current) {
        write('problems', 'is-bad', '✗', message);
      }
    },
    result(tone, mark, message) {
      write('result', tone, mark, message);
    },
  };
}
