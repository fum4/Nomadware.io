// TEMPORARY (NWARE-82): dev-only `?probe` readout to pin down the iOS scroll jitter on a real
// phone. A small fixed panel (no pointer events) shows the viewport's numbers live, so a
// screenshot before and after opening the keyboard says what changed. Loaded only in dev
// (index.astro); remove with scripts/bisect.ts.

import { measureCounts } from './bisect';

const round = (value: number): string => value.toFixed(2);

export function initViewportProbe(): void {
  const viewport = window.visualViewport;
  const panel = document.createElement('pre');
  panel.setAttribute('aria-hidden', 'true');
  panel.style.cssText =
    'position:fixed;top:0;left:0;z-index:99;margin:0;padding:4px 6px;pointer-events:none;' +
    'font:10px/1.3 monospace;color:#cf0;background:rgba(0,0,0,.75);white-space:pre';
  document.body.append(panel);

  const track = document.querySelector<HTMLElement>('[data-principles]');
  const stage = document.querySelector<HTMLElement>('[data-principles-stage]');
  const form = document.querySelector<HTMLElement>('[data-contact]');
  const counts = { resize: 0, vvResize: 0, vvScroll: 0 };
  window.addEventListener('resize', () => (counts.resize += 1));
  viewport?.addEventListener('resize', () => (counts.vvResize += 1));
  viewport?.addEventListener('scroll', () => (counts.vvScroll += 1));

  // Per frame: the pinned stage's distance from the top (should be 0), and whether the form's
  // place in the document moved (a layout shift above it).
  let stageOff = 0;
  let maxOffsetTop = 0;
  let formShifts = 0;
  let formTop: number | undefined;
  const sample = (): void => {
    if (track && stage && track.classList.contains('is-pinned')) {
      const t = track.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      if (t.top < -1 && t.bottom > s.height + 1) stageOff = Math.max(stageOff, Math.abs(s.top));
    }
    if (form) {
      const top = Math.round(form.getBoundingClientRect().top + window.scrollY);
      if (formTop !== undefined && top !== formTop) formShifts += 1;
      formTop = top;
    }
    if (viewport) maxOffsetTop = Math.max(maxOffsetTop, Math.abs(viewport.offsetTop));
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);

  const render = (): void => {
    const vars = track
      ? ['--stage-h', '--visible-h', '--track-room'].map((name) =>
          track.style.getPropertyValue(name),
        )
      : [];
    panel.textContent = [
      `inner ${window.innerWidth}×${window.innerHeight} screen ${screen.width}×${screen.height}`,
      viewport
        ? `vv h ${round(viewport.height)} offTop ${round(viewport.offsetTop)} (max ${round(maxOffsetTop)}) scale ${round(viewport.scale)}`
        : 'no visualViewport',
      `scrollY ${round(window.scrollY)} − vv.pageTop ${viewport ? round(window.scrollY - viewport.pageTop) : '?'}`,
      `doc ${document.documentElement.scrollHeight} stage/visible/room ${vars.join(' ')}`,
      `pinned ${track?.classList.contains('is-pinned') ? 'y' : 'n'} max stage off ${round(stageOff)} form shifts ${formShifts}`,
      `events resize ${counts.resize} vv resize ${counts.vvResize} vv scroll ${counts.vvScroll}`,
      `re-measures ${[...measureCounts()].map(([name, count]) => `${name} ${count}`).join(' ') || 'none'}`,
    ].join('\n');
  };
  render();
  window.setInterval(render, 250);
}
