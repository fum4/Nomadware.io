import { CONTACT_FIELDS } from '../../contact/validation';
import type { ContactField } from '../../contact/validation';

/** One prompt line of the contact terminal and the control inside it. */
export interface ContactLine {
  field: ContactField;
  root: HTMLElement;
  control: HTMLInputElement | HTMLTextAreaElement;
  vis: HTMLElement;
  /** Value at the last paint, to tell freshly typed characters apart. */
  painted: string;
}

export function readLines(form: HTMLFormElement): ContactLine[] {
  return [...form.querySelectorAll<HTMLElement>('[data-field]')].flatMap((root) => {
    const field = CONTACT_FIELDS.find((name) => name === root.dataset.field);
    const control = root.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    const vis = root.querySelector<HTMLElement>('.term-vis');
    if (!field || !control || !vis) return [];
    return [{ field, root, control, vis, painted: '' }];
  });
}
