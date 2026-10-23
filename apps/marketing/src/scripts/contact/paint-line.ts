import type { ContactLine } from './contact-line';

const span = (className: string, text = ''): HTMLSpanElement => {
  const element = document.createElement('span');
  element.className = className;
  element.textContent = text;
  return element;
};

/** The placeholder, long and (when the field has one) short; contact-field.css shows one by width. */
function placeholder(control: HTMLElement): HTMLSpanElement {
  const ph = span('term-ph');
  ph.append(span('term-ph-long', control.dataset.placeholder));
  const short = control.dataset.placeholderShort;
  if (short) ph.append(span('term-ph-short', short));
  return ph;
}

/**
 * Redraw a line's visible copy: the value with a caret at the selection, newly typed characters
 * glowing lime for a moment, or the placeholder when empty.
 */
export function paintLine(line: ContactLine, showCaret: boolean, fresh = false): void {
  const { control, vis } = line;
  const value = control.value;
  const focused = document.activeElement === control;
  const caretAt = focused ? (control.selectionStart ?? value.length) : value.length;
  const added = fresh ? value.length - line.painted.length : 0;
  const caret = showCaret ? [span('term-caret')] : [];

  if (!value) {
    vis.replaceChildren(...caret, placeholder(control));
  } else {
    const chars = [...value].map((char, index) =>
      added > 0 && index >= caretAt - added && index < caretAt
        ? span('term-fresh', char)
        : document.createTextNode(char),
    );
    vis.replaceChildren(...chars.slice(0, caretAt), ...caret, ...chars.slice(caretAt));
  }
  line.painted = value;
}
