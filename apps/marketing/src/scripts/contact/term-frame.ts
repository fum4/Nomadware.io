// The contact terminal's frame (styles/contact-terminal.css): it flickers on when focus enters the
// form and off when focus leaves. The "off" flicker may only run after the frame has been lit
// once, or it would play on page load; this marks that moment.

const LIT_ONCE = 'was-lit';

export function initTermFrame(): void {
  const term = document.querySelector<HTMLElement>('[data-contact]');
  term?.addEventListener('focusin', () => term.classList.add(LIT_ONCE), { once: true });
}
