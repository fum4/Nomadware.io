/** One prompt line of the contact terminal and the control inside it. */
export interface ContactLine {
  root: HTMLElement;
  control: HTMLInputElement | HTMLTextAreaElement;
  vis: HTMLElement;
  error: HTMLElement | null;
  /** Value at the last paint, to tell freshly typed characters apart. */
  painted: string;
}

export function readLines(form: HTMLFormElement): ContactLine[] {
  return [...form.querySelectorAll<HTMLElement>('[data-field]')].flatMap((root) => {
    const control = root.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
    const vis = root.querySelector<HTMLElement>('.term-vis');
    if (!control || !vis) return [];
    return [{ root, control, vis, error: root.querySelector('[data-error]'), painted: '' }];
  });
}
