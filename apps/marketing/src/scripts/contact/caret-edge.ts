import type { ContactLine } from './contact-line';

/** Is the caret on the field's first visual line (so ↑ should leave it)? Inputs: always. */
export function caretOnFirstLine(line: ContactLine): boolean {
  if (line.control instanceof HTMLInputElement) return true;
  const caret = line.vis.querySelector<HTMLElement>('.term-caret');
  if (!caret) return true;
  const lineHeight = Number.parseFloat(getComputedStyle(line.vis).lineHeight);
  return caret.offsetTop - line.vis.offsetTop < lineHeight * 0.8;
}
